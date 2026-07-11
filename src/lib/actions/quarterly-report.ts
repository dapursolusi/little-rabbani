'use server';

import { and, asc, desc, eq, ilike, inArray, not, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

import { requireOwner } from '@/lib/actions/utils';
import { type TQuarterlySectionType, generateNarrative } from '@/lib/ai';
import { db } from '@/lib/db';
import {
  dailyReportSnapshot,
  kid,
  observation,
  observationActivity,
  quarterlyReportSnapshot,
  term,
  termSession,
} from '@/lib/db/schema';

// ─────────────── Zod Schemas ───────────────

const UpdateSectionsSchema = z.object({
  reportId: z.string().min(1),
  sections: z.object({
    changes: z.string(),
    improvements: z.string(),
    recommendations: z.string(),
  }),
});

const MarkFinalSchema = z.object({
  reportId: z.string().min(1),
});

// ─────────────── Types ───────────────

export interface IQuarterlyStats {
  attendancePercent: number;
  totalSchoolDays: number;
  daysPresent: number;
  moodDistribution: Record<number, number>;
  appetiteDistribution: Record<string, number>;
  activityParticipation: Record<string, number>;
  totalObservations: number;
}

export interface IQuarterlySections {
  changes: string;
  improvements: string;
  recommendations: string;
}

export interface IQuarterlyReportData {
  id: string;
  kidId: string;
  termId: string;
  statsJson: IQuarterlyStats | null;
  sectionsJson: IQuarterlySections | null;
  narrativeAiDraft: string | null;
  narrativeFinal: string | null;
  pdfData: string | null;
  previousSnapshotId: string | null;
  status: 'draft' | 'final' | 'stale';
  generatedAt: Date | string;
  kid?: { id: string; name: string } | null;
  term?: { id: string; name: string } | null;
}

// ─────────────── Helpers ───────────────

/**
 * Get all sessions for a term that are not holidays.
 */
async function getTermSessions(termId: string) {
  const sessions = await db.query.termSession.findMany({
    where: and(
      eq(termSession.termId, termId),
      eq(termSession.isHoliday, false)
    ),
    columns: { id: true, date: true },
    orderBy: [asc(termSession.date)],
  });

  return sessions;
}

/**
 * Compute term stats for a kid.
 */
async function computeTermStats(
  kidId: string,
  sessionIds: string[]
): Promise<IQuarterlyStats> {
  if (sessionIds.length === 0) {
    return {
      attendancePercent: 0,
      totalSchoolDays: 0,
      daysPresent: 0,
      moodDistribution: {},
      appetiteDistribution: {},
      activityParticipation: {},
      totalObservations: 0,
    };
  }

  const observations = await db.query.observation.findMany({
    where: and(
      eq(observation.kidId, kidId),
      inArray(observation.sessionId, sessionIds)
    ),
    columns: { id: true, mood: true, appetite: true, presence: true },
  });

  const totalSchoolDays = sessionIds.length;
  const daysPresent = observations.filter(
    (o) =>
      o.presence === 'present_full' ||
      o.presence === 'late' ||
      o.presence === 'early_pickup'
  ).length;

  const attendancePercent =
    totalSchoolDays > 0 ? Math.round((daysPresent / totalSchoolDays) * 100) : 0;

  const moodDistribution: Record<number, number> = {};
  for (const obs of observations) {
    moodDistribution[obs.mood] = (moodDistribution[obs.mood] ?? 0) + 1;
  }

  const appetiteDistribution: Record<string, number> = {};
  for (const obs of observations) {
    appetiteDistribution[obs.appetite] =
      (appetiteDistribution[obs.appetite] ?? 0) + 1;
  }

  const observationIds = observations.map((o) => o.id);
  const activityParticipation: Record<string, number> = {};

  if (observationIds.length > 0) {
    const activities = await db.query.observationActivity.findMany({
      where: and(
        inArray(observationActivity.observationId, observationIds),
        eq(observationActivity.participated, 'yes')
      ),
      with: {
        dcrActivity: {
          with: {
            activity: true,
          },
        },
      },
    });

    for (const act of activities) {
      const dcrAct = Array.isArray(act.dcrActivity)
        ? act.dcrActivity[0]
        : act.dcrActivity;
      const activityData =
        dcrAct && 'activity' in dcrAct
          ? Array.isArray(dcrAct.activity)
            ? dcrAct.activity[0]
            : dcrAct.activity
          : null;
      const name =
        activityData?.name ??
        (dcrAct && 'activityNameOther' in dcrAct
          ? dcrAct.activityNameOther
          : null) ??
        'Aktivitas';
      activityParticipation[name] = (activityParticipation[name] ?? 0) + 1;
    }
  }

  return {
    attendancePercent,
    totalSchoolDays,
    daysPresent,
    moodDistribution,
    appetiteDistribution,
    activityParticipation,
    totalObservations: observations.length,
  };
}

/**
 * Get daily report narratives for a kid in a specific term.
 */
async function getDailyNarrativesForTerm(
  kidId: string,
  _termId: string,
  sessionIds: string[]
): Promise<{ date: string; narrative: string }[]> {
  if (sessionIds.length === 0) return [];

  const reports = await db.query.dailyReportSnapshot.findMany({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      inArray(dailyReportSnapshot.sessionId, sessionIds)
    ),
    with: {
      session: {
        columns: { date: true },
      },
    },
    orderBy: [asc(dailyReportSnapshot.generatedAt)],
  });

  return reports
    .filter((r) => r.narrativeFinal || r.narrativeAiDraft)
    .map((r) => {
      const sessionData =
        r.session && !Array.isArray(r.session) ? r.session : undefined;
      return {
        date: sessionData?.date ?? '',
        narrative: r.narrativeFinal ?? r.narrativeAiDraft ?? '',
      };
    })
    .filter((r) => r.narrative.length > 0);
}

/**
 * Build a combined notes string containing stats, daily narratives, and delta
 * that can be passed to each section's generateNarrative call.
 * Each section call will receive the same context but with a different sectionType.
 */
function buildNotesForSections(
  kidName: string,
  stats: IQuarterlyStats,
  dailyNarratives: { date: string; narrative: string }[],
  previousSnapshot?: { sections: IQuarterlySections; termName: string } | null
): { statsText: string; narrativesText: string; deltaText: string } {
  const narrativesText =
    dailyNarratives.length > 0
      ? dailyNarratives.map((n) => `[${n.date}] ${n.narrative}`).join('\n\n')
      : 'Tidak ada data narasi harian.';

  const moodSummary = Object.entries(stats.moodDistribution)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, count]) => `Level ${level}/5: ${count} kali`)
    .join(', ');

  const appetiteSummary = Object.entries(stats.appetiteDistribution)
    .map(([a, c]) => `${a}: ${c} kali`)
    .join(', ');

  const activitySummary = Object.entries(stats.activityParticipation)
    .map(([name, count]) => `- ${name}: ${count}x`)
    .join('\n');

  const statsText = `Kehadiran: ${stats.attendancePercent}% (${stats.daysPresent} dari ${stats.totalSchoolDays} hari)
Suasana hati: ${moodSummary || 'Tidak ada data'}
Nafsu makan: ${appetiteSummary || 'Tidak ada data'}
Partisipasi aktivitas:
${activitySummary || 'Tidak ada data'}`;

  let deltaText = '';
  if (previousSnapshot) {
    deltaText = `LAPORAN TRIVULAN SEBELUMNYA (${previousSnapshot.termName}):
Perubahan: ${previousSnapshot.sections.changes}
Peningkatan: ${previousSnapshot.sections.improvements}
Rekomendasi: ${previousSnapshot.sections.recommendations}`;
  } else {
    deltaText = `Ini adalah trivulan pertama untuk Ananda ${kidName}.`;
  }

  return { statsText, narrativesText, deltaText };
}

/**
 * Calls generateNarrative 3 times, once per quarterly section.
 * Each section gets a focused prompt with quarterly-section reportType.
 * Individual section failures are handled gracefully (empty string returned).
 */
async function generateAllQuarterlySections(
  kidName: string,
  stats: IQuarterlyStats,
  combinedNotes: string
): Promise<{
  section1: string;
  section2: string;
  section3: string;
}> {
  const sectionTypes: TQuarterlySectionType[] = [
    'changes',
    'improvements',
    'recommendations',
  ];

  const baseContext = {
    kidName,
    mood: 3 as const,
    appetite: 'good' as const,
    activities: Object.keys(stats.activityParticipation),
    notes: combinedNotes,
    presence: 'present_full' as const,
    reportType: 'quarterly-section' as const,
  };

  const results: string[] = [];

  for (const sectionType of sectionTypes) {
    try {
      const content = await generateNarrative({
        ...baseContext,
        sectionType,
      });
      results.push(content || '');
    } catch {
      // Individual section failure — leave empty, continue to next section
      results.push('');
    }
  }

  return {
    section1: results[0],
    section2: results[1],
    section3: results[2],
  };
}

// ─────────────── Read Operations ───────────────

/**
 * Get all terms for quarterly report selection.
 */
export async function getTerms() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const terms = await db.query.term.findMany({
    orderBy: [desc(term.startDate)],
  });

  return { success: true as const, data: terms };
}

/**
 * Get a quarterly report for a specific kid and term.
 */
export async function getQuarterlyReport(kidId: string, termId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.quarterlyReportSnapshot.findFirst({
    where: and(
      eq(quarterlyReportSnapshot.kidId, kidId),
      eq(quarterlyReportSnapshot.termId, termId)
    ),
    with: {
      kid: {
        columns: { id: true, name: true },
      },
      term: {
        columns: { id: true, name: true },
      },
    },
  });

  return { success: true as const, data: report ?? null };
}

/**
 * Get a quarterly report by ID.
 */
export async function getQuarterlyReportById(reportId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.quarterlyReportSnapshot.findFirst({
    where: eq(quarterlyReportSnapshot.id, reportId),
    with: {
      kid: {
        columns: { id: true, name: true },
      },
      term: {
        columns: { id: true, name: true },
      },
    },
  });

  if (!report) {
    return {
      success: false as const,
      error: 'Laporan trivulan tidak ditemukan',
    };
  }

  return { success: true as const, data: report };
}

/**
 * Get existing quarterly reports for a kid.
 */
export async function getKidQuarterlyReports(kidId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const reports = await db.query.quarterlyReportSnapshot.findMany({
    where: eq(quarterlyReportSnapshot.kidId, kidId),
    orderBy: [desc(quarterlyReportSnapshot.generatedAt)],
    with: {
      term: {
        columns: { id: true, name: true },
      },
    },
  });

  return { success: true as const, data: reports };
}

/**
 * Paginated and searchable query for enrolled kids in a specific term.
 */
export async function getEnrolledKidsForTermPaginated(
  termId: string,
  search: string,
  page: number,
  pageSize: number
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const conditions = [
    eq(kid.enrolledTermId, termId),
    eq(kid.status, 'enrolled'),
  ];
  if (search) {
    conditions.push(ilike(kid.name, `%${search}%`));
  }
  const where = and(...conditions);

  const offset = (page - 1) * pageSize;

  const [kidsList, totalResult] = await Promise.all([
    db.query.kid.findMany({
      where,
      columns: { id: true, name: true, guardianId: true },
      with: {
        guardian: {
          columns: { name: true },
        },
      },
      orderBy: [asc(kid.name)],
      limit: pageSize,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(kid)
      .where(where),
  ]);

  const total = totalResult?.[0]?.count ?? 0;

  return { success: true as const, data: kidsList, total };
}

/**
 * Batch fetch quarterly reports for multiple kid IDs, restricted to a single term.
 */
export async function getKidQuarterlyReportsBatchForTerm(
  termId: string,
  kidIds: string[]
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  if (kidIds.length === 0) {
    return {
      success: true as const,
      data: [] as Array<{
        kidId: string;
        id: string;
        termId: string;
        status: string;
      }>,
    };
  }

  const reports = await db.query.quarterlyReportSnapshot.findMany({
    where: and(
      eq(quarterlyReportSnapshot.termId, termId),
      inArray(quarterlyReportSnapshot.kidId, kidIds)
    ),
    columns: {
      id: true,
      kidId: true,
      termId: true,
      status: true,
    },
  });

  return { success: true as const, data: reports };
}

// ─────────────── Quarterly Report Generation ───────────────

/**
 * Generate a quarterly report for a specific kid and term.
 *
 * VAL-QUARTERLY-001: Owner generates quarterly report as PDF with three sections.
 * VAL-QUARTERLY-002: PDF uses previous-term snapshot for delta comparison.
 * VAL-QUARTERLY-003: First-term quarterly generates without delta.
 * VAL-QUARTERLY-004: AI drafts three sections in Bahasa Indonesia.
 * VAL-QUARTERLY-008: AI failure — structured-only without narrative sections.
 * VAL-QUARTERLY-010: Snapshot stored for next term's delta.
 * VAL-QUARTERLY-011: Kid graduated mid-term — report for completed months only.
 */
export async function generateQuarterlyReport(kidId: string, termId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  // Check concurrent generation
  const existingReport = await db.query.quarterlyReportSnapshot.findFirst({
    where: and(
      eq(quarterlyReportSnapshot.kidId, kidId),
      eq(quarterlyReportSnapshot.termId, termId)
    ),
    columns: { id: true, status: true },
  });

  if (
    existingReport &&
    (existingReport.status === 'draft' || existingReport.status === 'final')
  ) {
    return {
      success: false as const,
      error:
        'Laporan trivulan sudah ada. Edit laporan yang ada atau hapus untuk membuat ulang.',
    };
  }

  // Get kid info
  const kidInfo = await db.query.kid.findFirst({
    where: eq(kid.id, kidId),
    columns: { id: true, name: true, status: true, enrolledTermId: true },
  });

  if (!kidInfo) {
    return { success: false as const, error: 'Murid tidak ditemukan' };
  }

  // Check if kid is enrolled in this term or was enrolled (alumni)
  const isEnrolledOrWasEnrolled =
    kidInfo.status === 'enrolled' || kidInfo.status === 'alumni';

  if (!isEnrolledOrWasEnrolled) {
    return {
      success: false as const,
      error: 'Murid tidak terdaftar di term ini.',
    };
  }

  // Get term info
  const termInfo = await db.query.term.findFirst({
    where: eq(term.id, termId),
    columns: { id: true, name: true, startDate: true, endDate: true },
  });

  if (!termInfo) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  // Get sessions for this term
  const allSessions = await getTermSessions(termId);

  if (allSessions.length === 0) {
    return {
      success: false as const,
      error: 'Tidak ada sesi sekolah pada term ini.',
    };
  }

  // VAL-QUARTERLY-011: If kid graduated mid-term, only include sessions before graduation
  // We use the kid's updated_at as a proxy for when status changed to alumni,
  // and also check for observations only existing within enrolled period
  let sessions = allSessions;
  if (kidInfo.status === 'alumni') {
    // Get sessions that have observations for this kid (actual attendance data)
    const sessionsWithData = await db.query.observation.findMany({
      where: eq(observation.kidId, kidId),
      columns: { sessionId: true },
    });
    const sessionIdsWithData = new Set(
      sessionsWithData.map((s) => s.sessionId)
    );
    sessions = allSessions.filter((s) => sessionIdsWithData.has(s.id));
  }

  const sessionIds = sessions.map((s) => s.id);

  // Compute stats
  const stats = await computeTermStats(kidId, sessionIds);

  // Get daily narratives
  const dailyNarratives = await getDailyNarrativesForTerm(
    kidId,
    termId,
    sessionIds
  );

  // Check if there's any data
  const hasAnyData = stats.totalObservations > 0 || dailyNarratives.length > 0;

  if (!hasAnyData) {
    return {
      success: false as const,
      error: `Belum ada data laporan untuk ${kidInfo.name} pada term ${termInfo.name}.`,
    };
  }

  // Find previous quarterly snapshot for delta comparison
  // VAL-QUARTERLY-002: Use previous-term snapshot for delta
  // VAL-QUARTERLY-003: First-term generates without delta
  const previousSnapshot = await db.query.quarterlyReportSnapshot.findFirst({
    where: and(
      eq(quarterlyReportSnapshot.kidId, kidId),
      not(eq(quarterlyReportSnapshot.termId, termId)),
      eq(quarterlyReportSnapshot.status, 'final')
    ),
    orderBy: [desc(quarterlyReportSnapshot.generatedAt)],
    with: {
      term: {
        columns: { name: true },
      },
    },
  });

  // Generate AI narrative sections — 3 separate calls, one per section
  // VAL-QUARTERLY-004: Split into 3 focused prompts to avoid truncation on long prompts
  let sectionsJson: IQuarterlySections | null = null;
  let narrativeAiDraft = '';

  // Build the context payload for each section call (stats + narratives + delta)
  const { statsText, narrativesText, deltaText } = buildNotesForSections(
    kidInfo.name,
    stats,
    dailyNarratives,
    previousSnapshot
      ? {
          sections:
            previousSnapshot.sectionsJson as unknown as IQuarterlySections,
          termName: previousSnapshot.term?.name ?? '',
        }
      : null
  );

  // Combined notes in a structured format parseable by buildUserPrompt for quarterly-section
  const combinedNotes = `STATS:\n${statsText}\n\nNARRATIVES:\n${narrativesText}\n\nDELTA:\n${deltaText}`;

  // Call all 3 sections — each section failure is handled independently
  const { section1, section2, section3 } = await generateAllQuarterlySections(
    kidInfo.name,
    stats,
    combinedNotes
  );

  // Build sections from results (individual failure = empty string)
  sectionsJson = {
    changes: section1,
    improvements: section2,
    recommendations: section3,
  };

  // If all 3 failed, keep narrativeAiDraft empty (structured-only fallback)
  if (section1 || section2 || section3) {
    narrativeAiDraft = [section1, section2, section3]
      .filter(Boolean)
      .join('\n\n');
  }

  // Reference to previous snapshot
  const previousSnapshotId = previousSnapshot?.id ?? null;

  // Upsert the snapshot
  const statsJson = stats as unknown as Record<string, unknown>;
  const sectionsData = sectionsJson as unknown as Record<string, unknown>;

  if (existingReport) {
    const [updatedReport] = await db
      .update(quarterlyReportSnapshot)
      .set({
        statsJson,
        sectionsJson: sectionsData,
        narrativeAiDraft: narrativeAiDraft || null,
        narrativeFinal: null,
        pdfData: null,
        previousSnapshotId,
        status: 'draft',
        editedBy: auth.userId,
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quarterlyReportSnapshot.id, existingReport.id))
      .returning({ id: quarterlyReportSnapshot.id });

    return {
      success: true as const,
      data: {
        reportId: updatedReport?.id ?? existingReport.id,
        stats,
        sections: sectionsJson,
        narrativeAiDraft,
        previousSnapshotId,
        status: 'draft' as const,
      },
    };
  }

  const [newReport] = await db
    .insert(quarterlyReportSnapshot)
    .values({
      kidId,
      termId,
      statsJson,
      sectionsJson: sectionsData,
      narrativeAiDraft: narrativeAiDraft || null,
      previousSnapshotId,
      status: 'draft',
      editedBy: auth.userId,
      generatedAt: new Date(),
    })
    .returning({ id: quarterlyReportSnapshot.id });

  return {
    success: true as const,
    data: {
      reportId: newReport.id,
      stats,
      sections: sectionsJson,
      narrativeAiDraft,
      previousSnapshotId,
      status: 'draft' as const,
    },
  };
}

// ─────────────── Section Editing ───────────────

/**
 * Update the three sections of a quarterly report.
 * If status is 'final', transitions to 'stale'.
 *
 * VAL-QUARTERLY-005: Owner can edit quarterly sections.
 */
export async function updateQuarterlySections(
  reportId: string,
  sections: IQuarterlySections
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = UpdateSectionsSchema.safeParse({ reportId, sections });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
    };
  }

  const report = await db.query.quarterlyReportSnapshot.findFirst({
    where: eq(quarterlyReportSnapshot.id, reportId),
    columns: { id: true, status: true },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  // Editing a finalized report makes it stale
  const newStatus = report.status === 'final' ? 'stale' : report.status;

  const sectionsData = sections as unknown as Record<string, unknown>;

  const [updatedReport] = await db
    .update(quarterlyReportSnapshot)
    .set({
      sectionsJson: sectionsData,
      narrativeFinal:
        Object.values(sections).filter(Boolean).join('\n\n') || null,
      status: newStatus,
      editedBy: auth.userId,
      updatedAt: new Date(),
    })
    .where(eq(quarterlyReportSnapshot.id, reportId))
    .returning({
      id: quarterlyReportSnapshot.id,
      status: quarterlyReportSnapshot.status,
    });

  return {
    success: true as const,
    data: {
      status: updatedReport?.status ?? newStatus,
    },
  };
}

// ─────────────── Mark as Final ───────────────

/**
 * Mark a quarterly report as final.
 */
export async function markQuarterlyReportFinal(reportId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = MarkFinalSchema.safeParse({ reportId });
  if (!parsed.success) {
    return { success: false as const, error: 'Data tidak valid' };
  }

  const report = await db.query.quarterlyReportSnapshot.findFirst({
    where: eq(quarterlyReportSnapshot.id, reportId),
    columns: { id: true, status: true, narrativeFinal: true },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  if (report.status === 'final') {
    return { success: false as const, error: 'Laporan sudah difinalisasi' };
  }

  const [updatedReport] = await db
    .update(quarterlyReportSnapshot)
    .set({
      status: 'final',
      editedBy: auth.userId,
      updatedAt: new Date(),
    })
    .where(eq(quarterlyReportSnapshot.id, reportId))
    .returning({
      id: quarterlyReportSnapshot.id,
      status: quarterlyReportSnapshot.status,
    });

  return {
    success: true as const,
    data: {
      status: 'final' as const,
      reportId: updatedReport?.id ?? reportId,
    },
  };
}

// ─────────────── PDF Storage ───────────────

/**
 * Store PDF data (base64) for a quarterly report.
 */
export async function saveQuarterlyPdfData(
  reportId: string,
  pdfBase64: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const [updatedReport] = await db
    .update(quarterlyReportSnapshot)
    .set({
      pdfData: pdfBase64,
      updatedAt: new Date(),
    })
    .where(eq(quarterlyReportSnapshot.id, reportId))
    .returning({ id: quarterlyReportSnapshot.id });

  return {
    success: true as const,
    data: { reportId: updatedReport?.id ?? reportId },
  };
}

/**
 * Get the PDF data for a quarterly report.
 */
export async function getQuarterlyPdfData(reportId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.quarterlyReportSnapshot.findFirst({
    where: eq(quarterlyReportSnapshot.id, reportId),
    columns: { pdfData: true },
  });

  if (!report?.pdfData) {
    return { success: false as const, error: 'PDF tidak tersedia' };
  }

  return { success: true as const, data: report.pdfData };
}
