'use server';

import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

import { requireOwner } from '@/lib/actions/utils';
import { generateNarrative } from '@/lib/ai';
import { db } from '@/lib/db';
import {
  dailyReportSnapshot,
  kid,
  observation,
  observationNote,
  sessionType,
} from '@/lib/db/schema';

// ─────────────── Zod Schemas ───────────────

const UpdateNarrativeSchema = z.object({
  kidId: z.string().min(1),
  date: z.string().min(1),
  narrative: z.string().min(1, 'Narasi tidak boleh kosong'),
});

const MarkSentSchema = z.object({
  kidId: z.string().min(1),
  date: z.string().min(1),
});

// ─────────────── Types ───────────────

export interface IStructuredData {
  mood: number;
  appetite: string;
  presence: string;
  absenceReason: string | null;
  activities: string[];
  notes: string[];
}

export interface IReportResult {
  kidId: string;
  kidName: string;
  status: 'success' | 'skipped' | 'error';
  reportId?: string;
  message?: string;
}

// ─────────────── Query Helpers ───────────────

/**
 * Get structured observation data for a kid on a given date.
 */
async function getObservationData(
  kidId: string,
  date: string
): Promise<IStructuredData | null> {
  const obs = await db.query.observation.findFirst({
    where: and(eq(observation.kidId, kidId), eq(observation.date, date)),
    with: {
      notes: {
        orderBy: [asc(observationNote.createdAt)],
      },
      activities: {
        with: {
          dcrActivity: {
            with: {
              activity: true,
            },
          },
        },
      },
    },
  });

  if (!obs) return null;

  return {
    mood: obs.mood,
    appetite: obs.appetite,
    presence: obs.presence,
    absenceReason: obs.absenceReason,
    activities: obs.activities
      .filter((a: { participated: string }) => a.participated === 'yes')
      .map((a) => {
        const dcrAct = (
          a as {
            dcrActivity: {
              activity: { name: string } | null;
              activityNameOther: string | null;
            };
          }
        ).dcrActivity;
        return (
          dcrAct?.activity?.name ?? dcrAct?.activityNameOther ?? 'Aktivitas'
        );
      })
      .filter(Boolean),
    notes: obs.notes.map((n: { text: string }) => n.text),
  };
}

// ─────────────── Read Operations ───────────────

/**
 * Get all session types with daily report counts.
 * Used for the session picker page.
 */
export async function getSessionsForDailyReports() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const types = await db.query.sessionType.findMany({
    where: and(eq(sessionType.active, true)),
    orderBy: [asc(sessionType.name)],
  });

  // Count reports per (date, sessionTypeId)
  const reportCounts = await db
    .select({
      date: dailyReportSnapshot.date,
      sessionTypeId: dailyReportSnapshot.sessionTypeId,
      count: sql<number>`count(*)::int`.mapWith(Number),
    })
    .from(dailyReportSnapshot)
    .groupBy(dailyReportSnapshot.date, dailyReportSnapshot.sessionTypeId);

  const reportCountByKey = new Map(
    reportCounts.map((r) => [`${r.date}:${r.sessionTypeId}`, r.count])
  );

  const sessionsWithCounts = types.map((t) => ({
    ...t,
    reportCount: reportCountByKey.get(`${''}:${t.id}`) ?? 0,
  }));

  return { success: true as const, data: sessionsWithCounts };
}

/**
 * Get all daily reports for a date + sessionTypeId.
 */
export async function getDailyReportsForSession(
  date: string,
  sessionTypeId: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const kids = await db.query.kid.findMany({
    where: eq(kid.status, 'enrolled'),
    columns: { id: true, name: true },
  });

  const reports = await db.query.dailyReportSnapshot.findMany({
    where: and(
      eq(dailyReportSnapshot.date, date),
      eq(dailyReportSnapshot.sessionTypeId, sessionTypeId)
    ),
    with: {
      kid: {
        columns: { id: true, name: true },
      },
    },
    orderBy: [desc(dailyReportSnapshot.generatedAt)],
  });

  return {
    success: true as const,
    data: {
      date,
      sessionTypeId,
      kids,
      reports,
    },
  };
}

/**
 * Get a single daily report for a kid on a given date.
 */
export async function getDailyReport(kidId: string, date: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.date, date)
    ),
  });

  return { success: true as const, data: report ?? null };
}

/**
 * Get the status of a daily report.
 */
export async function getDailyReportStatus(kidId: string, date: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.date, date)
    ),
    columns: { status: true, narrativeAiDraft: true, narrativeFinal: true },
  });

  return { success: true as const, data: report ?? null };
}

// ─────────────── Generation ───────────────

/**
 * Generate daily reports for all kids on a given date + sessionTypeId.
 */
export async function generateDailyReports(
  date: string,
  sessionTypeId: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const kids = await db.query.kid.findMany({
    where: and(eq(kid.status, 'enrolled')),
    columns: { id: true, name: true },
  });

  if (kids.length === 0) {
    return {
      success: false as const,
      error: 'Tidak ada murid terdaftar',
    };
  }

  // Generate reports in parallel for all kids
  const results: IReportResult[] = await Promise.all(
    kids.map(async (kidData) => {
      try {
        const structuredData = await getObservationData(kidData.id, date);

        if (!structuredData) {
          return {
            kidId: kidData.id,
            kidName: kidData.name,
            status: 'skipped' as const,
            message: 'Belum ada catatan observasi untuk Ananda ' + kidData.name,
          };
        }

        const narrativeContext = {
          kidName: kidData.name,
          mood: structuredData.mood,
          appetite: structuredData.appetite as 'good' | 'moderate' | 'poor',
          activities: structuredData.activities,
          notes:
            structuredData.notes.length > 0
              ? structuredData.notes.join('. ')
              : undefined,
          presence: structuredData.presence as
            'present_full' | 'late' | 'early_pickup' | 'absent',
          absenceReason: structuredData.absenceReason ?? undefined,
        };

        const narrativeAiDraft =
          structuredData.presence === 'absent'
            ? await generateNarrative({
                ...narrativeContext,
                presence: 'absent',
                absenceReason: structuredData.absenceReason ?? 'other',
                activities: [],
              })
            : await generateNarrative(narrativeContext);

        const existing = await db.query.dailyReportSnapshot.findFirst({
          where: and(
            eq(dailyReportSnapshot.kidId, kidData.id),
            eq(dailyReportSnapshot.date, date)
          ),
          columns: { id: true },
        });

        if (existing) {
          await db
            .update(dailyReportSnapshot)
            .set({
              structuredJson: structuredData,
              narrativeAiDraft: narrativeAiDraft || null,
              narrativeFinal: null,
              status: 'draft',
              editedBy: auth.userId,
              generatedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(dailyReportSnapshot.id, existing.id));

          return {
            kidId: kidData.id,
            kidName: kidData.name,
            status: 'success' as const,
            reportId: existing.id,
            message: 'Laporan berhasil diperbarui',
          };
        } else {
          const [newReport] = await db
            .insert(dailyReportSnapshot)
            .values({
              kidId: kidData.id,
              date,
              sessionTypeId,
              structuredJson: structuredData,
              narrativeAiDraft: narrativeAiDraft || null,
              status: 'draft',
              editedBy: auth.userId,
              generatedAt: new Date(),
            })
            .returning({ id: dailyReportSnapshot.id });

          return {
            kidId: kidData.id,
            kidName: kidData.name,
            status: 'success' as const,
            reportId: newReport.id,
            message: 'Laporan berhasil dibuat',
          };
        }
      } catch (error) {
        console.error(`Gagal membuat laporan untuk ${kidData.name}:`, error);
        return {
          kidId: kidData.id,
          kidName: kidData.name,
          status: 'error' as const,
          message: 'Gagal membuat laporan untuk ' + kidData.name,
        };
      }
    })
  );

  return { success: true as const, data: results };
}

// ─────────────── Mutations ───────────────

/**
 * Update the narrative of a daily report.
 */
export async function updateDailyReportNarrative(
  kidId: string,
  date: string,
  narrative: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = UpdateNarrativeSchema.safeParse({
    kidId,
    date,
    narrative,
  });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
    };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.date, date)
    ),
    columns: { id: true, status: true },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  const newStatus = report.status === 'sent' ? 'stale' : report.status;

  const [updatedReport] = await db
    .update(dailyReportSnapshot)
    .set({
      narrativeFinal: narrative,
      status: newStatus,
      editedBy: auth.userId,
      updatedAt: new Date(),
    })
    .where(eq(dailyReportSnapshot.id, report.id))
    .returning({
      id: dailyReportSnapshot.id,
      kidId: dailyReportSnapshot.kidId,
      date: dailyReportSnapshot.date,
      status: dailyReportSnapshot.status,
      narrativeFinal: dailyReportSnapshot.narrativeFinal,
      editedBy: dailyReportSnapshot.editedBy,
      updatedAt: dailyReportSnapshot.updatedAt,
    });

  return {
    success: true as const,
    data: {
      status: updatedReport?.status ?? newStatus,
      report: updatedReport ?? null,
    },
  };
}

/**
 * Mark a daily report as sent (draft → sent).
 */
export async function markDailyReportSent(kidId: string, date: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = MarkSentSchema.safeParse({ kidId, date });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
    };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.date, date)
    ),
    columns: { id: true, status: true, narrativeFinal: true },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  if (report.status !== 'draft') {
    return {
      success: false as const,
      error:
        report.status === 'sent'
          ? 'Laporan sudah ditandai terkirim'
          : 'Hanya laporan dengan status draft yang dapat ditandai terkirim',
    };
  }

  const [updatedReport] = await db
    .update(dailyReportSnapshot)
    .set({
      status: 'sent',
      narrativeFinal: report.narrativeFinal ?? null,
      editedBy: auth.userId,
      updatedAt: new Date(),
    })
    .where(eq(dailyReportSnapshot.id, report.id))
    .returning({
      id: dailyReportSnapshot.id,
      kidId: dailyReportSnapshot.kidId,
      date: dailyReportSnapshot.date,
      status: dailyReportSnapshot.status,
      narrativeFinal: dailyReportSnapshot.narrativeFinal,
      editedBy: dailyReportSnapshot.editedBy,
      updatedAt: dailyReportSnapshot.updatedAt,
    });

  return {
    success: true as const,
    data: { status: 'sent' as const, reportId: updatedReport?.id ?? report.id },
  };
}

/**
 * Get daily report detail for viewing/editing.
 */
export async function getDailyReportDetail(kidId: string, date: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.date, date)
    ),
    with: {
      kid: {
        columns: { id: true, name: true },
      },
    },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  const structuredData =
    report.structuredJson as unknown as IStructuredData | null;

  return {
    success: true as const,
    data: {
      ...report,
      structuredData,
    },
  };
}
