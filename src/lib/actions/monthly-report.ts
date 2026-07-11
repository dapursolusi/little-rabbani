'use server';

import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

import { requireOwner } from '@/lib/actions/utils';
import { generateNarrative } from '@/lib/ai';
import { db } from '@/lib/db';
import {
  dailyReportSnapshot,
  kid,
  monthlyReportSnapshot,
  observation,
  observationActivity,
  term,
  termSession,
} from '@/lib/db/schema';

// ─────────────── Zod Schemas ───────────────

const UpdateNarrativeSchema = z.object({
  reportId: z.string().min(1),
  narrative: z.string().min(1, 'Narasi tidak boleh kosong'),
});

const OverrideSchema = z.object({
  reportId: z.string().min(1),
});

// ─────────────── Types ───────────────

export interface IMonthlyStats {
  attendancePercent: number;
  totalSchoolDays: number;
  daysPresent: number;
  moodDistribution: Record<number, number>;
  appetiteDistribution: Record<string, number>;
  activityParticipation: Record<string, number>;
  totalObservations: number;
}

export interface ITermInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface IMonthOption {
  year: number;
  month: number;
  label: string;
  value: string; // "YYYY-MM"
}

export interface IMonthlyReportResult {
  kidId: string;
  kidName: string;
  status: 'success' | 'no_data' | 'error';
  reportId?: string;
  message?: string;
}

// ─────────────── Helpers ───────────────

/**
 * Generate the list of months between two dates, inclusive.
 */
function getMonthsBetween(start: string, end: string): IMonthOption[] {
  const months: IMonthOption[] = [];
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= endMonthStart) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1; // 1-based
    const monthStr = month.toString().padStart(2, '0');
    const label = `${year}-${monthStr}`;

    months.push({
      year,
      month,
      label,
      value: label,
    });

    current = new Date(year, current.getMonth() + 1, 1);
  }

  return months;
}

/**
 * Get sessions for a given term and month.
 * Returns session IDs within that month.
 */
async function getSessionsInMonth(termId: string, year: number, month: number) {
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  const sessions = await db.query.termSession.findMany({
    where: and(
      eq(termSession.termId, termId),
      sql`${termSession.date}::text LIKE ${prefix + '%'}`,
      eq(termSession.isHoliday, false)
    ),
    columns: { id: true, date: true },
  });

  return sessions;
}

/**
 * Compute monthly stats for a kid in a given month and term.
 * Stats: attendance %, mood distribution, appetite distribution,
 * activity participation counts.
 */
async function computeMonthlyStats(
  kidId: string,
  sessionIds: string[]
): Promise<IMonthlyStats> {
  // If no sessions, return empty stats
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

  // Get all observations for this kid in these sessions
  const observations = await db.query.observation.findMany({
    where: and(
      eq(observation.kidId, kidId),
      inArray(observation.sessionId, sessionIds)
    ),
    columns: {
      id: true,
      mood: true,
      appetite: true,
      presence: true,
    },
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

  // Mood distribution (1-5)
  const moodDistribution: Record<number, number> = {};
  for (const obs of observations) {
    moodDistribution[obs.mood] = (moodDistribution[obs.mood] ?? 0) + 1;
  }

  // Appetite distribution
  const appetiteDistribution: Record<string, number> = {};
  for (const obs of observations) {
    appetiteDistribution[obs.appetite] =
      (appetiteDistribution[obs.appetite] ?? 0) + 1;
  }

  // Activity participation counts — get activity participation for all
  // observations of this kid in the given sessions
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
      const name =
        act.dcrActivity?.activity?.name ??
        act.dcrActivity?.activityNameOther ??
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
 * Get daily report narratives for a kid in a specific month.
 * Used as source material for the monthly AI narrative.
 */
async function getDailyNarrativesForMonth(
  kidId: string,
  year: number,
  month: number
): Promise<{ date: string; narrative: string }[]> {
  const monthStr = month.toString().padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  const reports = await db.query.dailyReportSnapshot.findMany({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      sql`${dailyReportSnapshot.createdAt}::text LIKE ${prefix + '%'}`
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
    .map((r) => ({
      date: r.session?.date ?? '',
      narrative: r.narrativeFinal ?? r.narrativeAiDraft ?? '',
    }))
    .filter((r) => r.narrative.length > 0);
}

// ─────────────── Read Operations ───────────────

/**
 * Get the current active term.
 */
export async function getActiveTerm() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const activeTerm = await db.query.term.findFirst({
    where: eq(term.isActive, true),
  });

  if (!activeTerm) {
    return {
      success: false as const,
      error: 'Tidak ada term aktif. Aktifkan term terlebih dahulu.',
    };
  }

  return { success: true as const, data: activeTerm };
}

/**
 * Get enrolled kids for the active term.
 */
export async function getEnrolledKids(termId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const kidsList = await db.query.kid.findMany({
    where: and(eq(kid.enrolledTermId, termId), eq(kid.status, 'enrolled')),
    columns: { id: true, name: true, guardianId: true },
    with: {
      guardian: {
        columns: { name: true },
      },
    },
    orderBy: [asc(kid.name)],
  });

  return { success: true as const, data: kidsList };
}

/**
 * Get enrolled kids with pagination and search.
 * Supports case-insensitive ILIKE search on kid name, LIMIT/OFFSET pagination.
 */
export async function getEnrolledKidsPaginated(
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
  const totalPages = Math.ceil(total / pageSize);

  return {
    success: true as const,
    data: {
      kids: kidsList,
      total,
      page,
      totalPages,
      pageSize,
    },
  };
}

/**
 * Get month options for a term (all months covered by the term).
 */
export async function getMonthOptions(termId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const termInfo = await db.query.term.findFirst({
    where: eq(term.id, termId),
    columns: { startDate: true, endDate: true },
  });

  if (!termInfo) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  const months = getMonthsBetween(termInfo.startDate, termInfo.endDate);

  return { success: true as const, data: months };
}

/**
 * Get existing monthly reports for a kid.
 */
export async function getKidMonthlyReports(kidId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const reports = await db.query.monthlyReportSnapshot.findMany({
    where: eq(monthlyReportSnapshot.kidId, kidId),
    orderBy: [desc(monthlyReportSnapshot.month)],
    with: {
      term: {
        columns: { id: true, name: true },
      },
    },
  });

  return { success: true as const, data: reports };
}

/**
 * Batch fetch monthly reports for multiple kid IDs.
 * Uses a single inArray query instead of N+1 sequential awaits.
 */
export async function getKidMonthlyReportsBatch(kidIds: string[]) {
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
        month: string;
        status: string;
      }>,
    };
  }

  const reports = await db.query.monthlyReportSnapshot.findMany({
    where: inArray(monthlyReportSnapshot.kidId, kidIds),
    orderBy: [desc(monthlyReportSnapshot.month)],
    columns: {
      id: true,
      kidId: true,
      month: true,
      status: true,
    },
  });

  return { success: true as const, data: reports };
}

/**
 * Get a single monthly report by ID.
 */
export async function getMonthlyReport(reportId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.monthlyReportSnapshot.findFirst({
    where: eq(monthlyReportSnapshot.id, reportId),
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
      error: 'Laporan bulanan tidak ditemukan',
    };
  }

  return {
    success: true as const,
    data: report,
  };
}

/**
 * Get monthly reports for a kid in a specific month.
 */
export async function getMonthlyReportForKidMonth(
  kidId: string,
  month: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.monthlyReportSnapshot.findFirst({
    where: and(
      eq(monthlyReportSnapshot.kidId, kidId),
      eq(monthlyReportSnapshot.month, month)
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

// ─────────────── Monthly Report Generation ───────────────

/**
 * Generate a monthly report for a specific kid and month.
 * Computes stats via SQL aggregation, generates AI narrative from daily
 * report narratives, locks observations used.
 *
 * VAL-MONTHLY-001: Owner generates monthly report with stats + AI narrative.
 * VAL-MONTHLY-002: Stats are accurate (computed from source observations).
 * VAL-MONTHLY-003: AI narrative sourced from daily report narratives.
 * VAL-MONTHLY-004: AI narrative in Bahasa Indonesia.
 * VAL-MONTHLY-005: Observations are locked on generation.
 * VAL-MONTHLY-010: Concurrent generation blocked.
 * VAL-MONTHLY-011: Snapshot stored for future delta.
 */
export async function generateMonthlyReport(
  kidId: string,
  termId: string,
  month: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  // Parse month to get year and month number
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  // Check concurrent generation: if a report exists with status 'draft' or 'final',
  // generation is already in progress or completed
  const existingReport = await db.query.monthlyReportSnapshot.findFirst({
    where: and(
      eq(monthlyReportSnapshot.kidId, kidId),
      eq(monthlyReportSnapshot.month, month)
    ),
    columns: { id: true, status: true, generatedAt: true },
  });

  if (
    existingReport &&
    (existingReport.status === 'draft' || existingReport.status === 'final')
  ) {
    return {
      success: false as const,
      error:
        'Pembuatan laporan sedang berlangsung. Silakan tunggu atau refresh halaman.',
    };
  }

  // Get kid info
  const kidInfo = await db.query.kid.findFirst({
    where: eq(kid.id, kidId),
    columns: { id: true, name: true },
  });

  if (!kidInfo) {
    return { success: false as const, error: 'Murid tidak ditemukan' };
  }

  // Get sessions in the month
  const sessions = await getSessionsInMonth(termId, year, monthNum);

  if (sessions.length === 0) {
    return {
      success: false as const,
      error:
        'Tidak ada sesi sekolah pada bulan ini. Periksa jadwal term yang aktif.',
    };
  }

  // Compute stats
  const stats = await computeMonthlyStats(
    kidId,
    sessions.map((s) => s.id)
  );

  // Get daily narratives for AI
  const dailyNarratives = await getDailyNarrativesForMonth(
    kidId,
    year,
    monthNum
  );

  // Check if there are no daily reports at all
  const dailyReportCount = dailyNarratives.length;
  const hasAnyData = stats.totalObservations > 0 || dailyReportCount > 0;

  if (!hasAnyData) {
    return {
      success: false as const,
      error: `Belum ada data laporan harian untuk ${kidInfo.name} pada bulan ${month}.`,
    };
  }

  // Generate AI narrative
  let narrativeAiDraft = '';
  try {
    const toplevelMood =
      Object.keys(stats.moodDistribution).length > 0
        ? Math.round(
            Object.entries(stats.moodDistribution).reduce(
              (sum, [level, count]) => sum + Number(level) * count,
              0
            ) /
              Object.values(stats.moodDistribution).reduce(
                (sum, c) => sum + c,
                0
              )
          )
        : 3;

    // Concatenate daily narrative texts so the AI can reference them (VAL-MONTHLY-003)
    const concatenatedDailyNarratives = dailyNarratives
      .map((d) => `[${d.date}] ${d.narrative}`)
      .join('\n\n');

    narrativeAiDraft = await generateNarrative({
      kidName: kidInfo.name,
      mood: toplevelMood,
      appetite: 'good',
      activities: Object.keys(stats.activityParticipation),
      notes: concatenatedDailyNarratives || undefined,
      presence: 'present_full',
      reportType: 'monthly',
    });

    // Enhance with monthly-specific content if AI returned result
    if (narrativeAiDraft) {
      // Prepend an attendance summary paragraph
      narrativeAiDraft = `Laporan Bulanan Ananda ${kidInfo.name}

Kehadiran: ${stats.attendancePercent}% (${stats.daysPresent} dari ${stats.totalSchoolDays} hari sekolah).
Suasana hati: ${Object.entries(stats.moodDistribution)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([level, count]) => `Level ${level}/5 sebanyak ${count} kali`)
        .join(', ')}.
Nafsu makan: ${Object.entries(stats.appetiteDistribution)
        .map(([a, c]) => `${a} ${c} kali`)
        .join(', ')}.

${narrativeAiDraft}`;
    }
  } catch {
    // AI failure: structured-only fallback (VAL-MONTHLY-009)
    narrativeAiDraft = '';
  }

  // Get all observation IDs to lock
  const sessionIds = sessions.map((s) => s.id);
  const observationsInMonth = await db.query.observation.findMany({
    where: and(
      eq(observation.kidId, kidId),
      inArray(observation.sessionId, sessionIds)
    ),
    columns: { id: true },
  });
  const lockedObservationIds = observationsInMonth.map((o) => o.id);

  // Upsert the snapshot
  const statsJson = stats as unknown as Record<string, unknown>;

  if (existingReport) {
    const [updatedReport] = await db
      .update(monthlyReportSnapshot)
      .set({
        termId,
        statsJson,
        narrativeAiDraft: narrativeAiDraft || null,
        narrativeFinal: null,
        lockedObservationIds,
        status: 'draft',
        editedBy: auth.userId,
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(monthlyReportSnapshot.id, existingReport.id))
      .returning({ id: monthlyReportSnapshot.id });

    return {
      success: true as const,
      data: {
        reportId: updatedReport?.id ?? existingReport.id,
        stats,
        narrativeAiDraft,
        status: 'draft' as const,
      },
    };
  }

  const [newReport] = await db
    .insert(monthlyReportSnapshot)
    .values({
      kidId,
      termId,
      month,
      statsJson,
      narrativeAiDraft: narrativeAiDraft || null,
      lockedObservationIds,
      status: 'draft',
      editedBy: auth.userId,
      generatedAt: new Date(),
    })
    .returning({ id: monthlyReportSnapshot.id });

  return {
    success: true as const,
    data: {
      reportId: newReport.id,
      stats,
      narrativeAiDraft,
      status: 'draft' as const,
    },
  };
}

// ─────────────── Narrative Editing ───────────────

/**
 * Update the narrative of a monthly report.
 * If status is 'final', transitions to 'stale' to signal re-gen needed.
 *
 * VAL-MONTHLY-006: Owner can edit monthly narrative.
 */
export async function updateMonthlyReportNarrative(
  reportId: string,
  narrative: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = UpdateNarrativeSchema.safeParse({ reportId, narrative });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
    };
  }

  const report = await db.query.monthlyReportSnapshot.findFirst({
    where: eq(monthlyReportSnapshot.id, reportId),
    columns: { id: true, status: true },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  // Editing a finalized report makes it stale
  const newStatus = report.status === 'final' ? 'stale' : report.status;

  const [updatedReport] = await db
    .update(monthlyReportSnapshot)
    .set({
      narrativeFinal: narrative,
      status: newStatus,
      editedBy: auth.userId,
      updatedAt: new Date(),
    })
    .where(eq(monthlyReportSnapshot.id, reportId))
    .returning({
      id: monthlyReportSnapshot.id,
      status: monthlyReportSnapshot.status,
      narrativeFinal: monthlyReportSnapshot.narrativeFinal,
      updatedAt: monthlyReportSnapshot.updatedAt,
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
 * Mark a monthly report as final.
 */
export async function markMonthlyReportFinal(reportId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.monthlyReportSnapshot.findFirst({
    where: eq(monthlyReportSnapshot.id, reportId),
    columns: { id: true, status: true, narrativeFinal: true },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  if (report.status === 'final') {
    return {
      success: false as const,
      error: 'Laporan sudah difinalisasi',
    };
  }

  const [updatedReport] = await db
    .update(monthlyReportSnapshot)
    .set({
      status: 'final',
      narrativeFinal: report.narrativeFinal ?? undefined,
      editedBy: auth.userId,
      updatedAt: new Date(),
    })
    .where(eq(monthlyReportSnapshot.id, reportId))
    .returning({
      id: monthlyReportSnapshot.id,
      status: monthlyReportSnapshot.status,
    });

  return {
    success: true as const,
    data: { status: 'final' as const, reportId: updatedReport?.id ?? reportId },
  };
}

// ─────────────── Owner Override (Unlock Observations) ───────────────

/**
 * Owner override to unlock observations for a monthly report.
 * This transitions the report status to 'stale', clearing the locked
 * observation IDs, and prompting re-generation.
 *
 * VAL-MONTHLY-007: Owner override unlocks observations, marks report stale.
 */
export async function unlockObservationsForReport(reportId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = OverrideSchema.safeParse({ reportId });
  if (!parsed.success) {
    return {
      success: false as const,
      error: 'Data tidak valid',
    };
  }

  const report = await db.query.monthlyReportSnapshot.findFirst({
    where: eq(monthlyReportSnapshot.id, reportId),
    columns: { id: true, status: true },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  // Clear locked_observation_ids and set status to stale
  const [updatedReport] = await db
    .update(monthlyReportSnapshot)
    .set({
      lockedObservationIds: null,
      status: 'stale',
      editedBy: auth.userId,
      updatedAt: new Date(),
    })
    .where(eq(monthlyReportSnapshot.id, reportId))
    .returning({
      id: monthlyReportSnapshot.id,
      status: monthlyReportSnapshot.status,
    });

  return {
    success: true as const,
    data: {
      status: 'stale' as const,
      reportId: updatedReport?.id ?? reportId,
    },
  };
}
