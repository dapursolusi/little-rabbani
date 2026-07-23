'use server';

import { db } from '@/db';
import {
  dailyReportSnapshot,
  kid,
  monthlyReportSnapshot,
  observation,
  observationActivity,
  term,
} from '@/db/schema';
import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

import { requireOwner } from '@/lib/actions/utils';
import { generateNarrative } from '@/lib/ai';

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
  value: string;
}

export interface IMonthlyReportResult {
  kidId: string;
  kidName: string;
  status: 'success' | 'no_data' | 'error';
  reportId?: string;
  message?: string;
}

// ─────────────── Helpers ───────────────

function getMonthsBetween(start: string, end: string): IMonthOption[] {
  const months: IMonthOption[] = [];
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= endMonthStart) {
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
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
 * Get observation-based school days for a given term and month.
 */
async function getObservationDaysInMonth(
  _termId: string,
  year: number,
  month: number,
  _startDate: string,
  _endDate: string
) {
  const monthStr = month.toString().padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const monthEnd = `${year}-${monthStr}-31`;

  // Get unique dates in the month with observations
  const observations = await db.query.observation.findMany({
    where: and(
      gte(observation.date, monthStart),
      lte(observation.date, monthEnd)
    ),
    columns: { date: true },
    orderBy: [asc(observation.date)],
  });

  const uniqueDates = [...new Set(observations.map((o) => o.date))];
  return uniqueDates.map((date) => ({ id: date, date }));
}

/**
 * Compute monthly stats for a kid in a given date range.
 */
async function computeMonthlyStats(
  kidId: string,
  startDate: string,
  endDate: string
): Promise<IMonthlyStats> {
  if (!startDate || !endDate) {
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
      gte(observation.date, startDate),
      lte(observation.date, endDate)
    ),
    columns: {
      id: true,
      mood: true,
      appetite: true,
      presence: true,
      date: true,
    },
  });

  const uniqueDates = new Set(observations.map((o) => o.date));
  const totalSchoolDays = uniqueDates.size;
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
 */
async function getDailyNarrativesForMonth(
  kidId: string,
  year: number,
  month: number
): Promise<{ date: string; narrative: string }[]> {
  const monthStr = month.toString().padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const monthEnd = `${year}-${monthStr}-31`;

  const reports = await db.query.dailyReportSnapshot.findMany({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      gte(dailyReportSnapshot.date, monthStart),
      lte(dailyReportSnapshot.date, monthEnd)
    ),
    orderBy: [asc(dailyReportSnapshot.generatedAt)],
  });

  return reports
    .filter((r) => r.narrativeFinal || r.narrativeAiDraft)
    .map((r) => ({
      date: r.date ?? '',
      narrative: r.narrativeFinal ?? r.narrativeAiDraft ?? '',
    }))
    .filter((r) => r.narrative.length > 0);
}

// ─────────────── Read Operations ───────────────

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

export async function generateMonthlyReport(
  kidId: string,
  termId: string,
  month: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

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

  const kidInfo = await db.query.kid.findFirst({
    where: eq(kid.id, kidId),
    columns: { id: true, name: true },
  });

  if (!kidInfo) {
    return { success: false as const, error: 'Murid tidak ditemukan' };
  }

  const monthStart = `${year}-${monthStr}-01`;
  const monthEnd = `${year}-${monthStr}-31`;

  const sessions = await getObservationDaysInMonth(
    termId,
    year,
    monthNum,
    '',
    ''
  );

  if (sessions.length === 0) {
    return {
      success: false as const,
      error: 'Tidak ada data observasi pada bulan ini.',
    };
  }

  // Compute stats
  const stats = await computeMonthlyStats(kidId, monthStart, monthEnd);

  // Get daily narratives for AI
  const dailyNarratives = await getDailyNarrativesForMonth(
    kidId,
    year,
    monthNum
  );

  const dailyReportCount = dailyNarratives.length;
  const hasAnyData = stats.totalObservations > 0 || dailyReportCount > 0;

  if (!hasAnyData) {
    return {
      success: false as const,
      error: `Belum ada data laporan harian untuk ${kidInfo.name} pada bulan ${month}.`,
    };
  }

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

    if (narrativeAiDraft) {
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
    narrativeAiDraft = '';
  }

  // Lock observation IDs
  const observationsInMonth = await db.query.observation.findMany({
    where: and(
      eq(observation.kidId, kidId),
      gte(observation.date, monthStart),
      lte(observation.date, monthEnd)
    ),
    columns: { id: true },
  });
  const lockedObservationIds = observationsInMonth.map((o) => o.id);

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

// ─────────────── Owner Override ───────────────

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
