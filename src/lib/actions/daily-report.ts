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
  termSession,
} from '@/lib/db/schema';

// ─────────────── Zod Schemas ───────────────

const UpdateNarrativeSchema = z.object({
  kidId: z.string().min(1),
  sessionId: z.string().min(1),
  narrative: z.string().min(1, 'Narasi tidak boleh kosong'),
});

const MarkSentSchema = z.object({
  kidId: z.string().min(1),
  sessionId: z.string().min(1),
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
 * Get all enrolled kids for a session (via the term's enrolled kids).
 */
async function getEnrolledKidsForSession(
  sessionId: string
): Promise<{ id: string; name: string }[]> {
  const sessionData = await db.query.termSession.findFirst({
    where: eq(termSession.id, sessionId),
    columns: { termId: true },
  });

  if (!sessionData) return [];

  const kids = await db.query.kid.findMany({
    where: and(
      eq(kid.enrolledTermId, sessionData.termId),
      eq(kid.status, 'enrolled')
    ),
    columns: { id: true, name: true },
  });

  return kids;
}

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
 * Get all sessions with their daily report counts.
 * Used for the session picker page.
 */
export async function getSessionsForDailyReports() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const sessions = await db.query.termSession.findMany({
    orderBy: [desc(termSession.date), desc(termSession.startTime)],
    with: {
      term: true,
    },
  });

  // Count reports per session
  const reportCounts = await db
    .select({
      sessionId: dailyReportSnapshot.sessionId,
      count: sql<number>`count(*)::int`.mapWith(Number),
    })
    .from(dailyReportSnapshot)
    .groupBy(dailyReportSnapshot.sessionId);

  const reportCountBySession = new Map(
    reportCounts.map((r) => [r.sessionId, r.count])
  );

  const sessionsWithCounts = sessions.map((session) => ({
    ...session,
    reportCount: reportCountBySession.get(session.id) ?? 0,
  }));

  return { success: true as const, data: sessionsWithCounts };
}

/**
 * Get all daily reports for a session.
 * VAL-DAILY-001: Returns report entries per kid.
 */
export async function getDailyReportsForSession(sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const sessionData = await db.query.termSession.findFirst({
    where: eq(termSession.id, sessionId),
  });

  if (!sessionData) {
    return { success: false as const, error: 'Sesi tidak ditemukan' };
  }

  const kids = await getEnrolledKidsForSession(sessionId);

  const reports = await db.query.dailyReportSnapshot.findMany({
    where: eq(dailyReportSnapshot.sessionId, sessionId),
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
      session: sessionData,
      kids,
      reports,
    },
  };
}

/**
 * Get a single daily report for a kid in a session.
 */
export async function getDailyReport(kidId: string, sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.sessionId, sessionId)
    ),
  });

  return { success: true as const, data: report ?? null };
}

/**
 * Get the status of a daily report.
 * VAL-DAILY-008: Status check for draft/sent/stale.
 */
export async function getDailyReportStatus(kidId: string, sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.sessionId, sessionId)
    ),
    columns: { status: true, narrativeAiDraft: true, narrativeFinal: true },
  });

  return { success: true as const, data: report ?? null };
}

// ─────────────── Generation ───────────────

/**
 * Generate daily reports for all kids in a session.
 * Runs in parallel for all kids with observations.
 * VAL-DAILY-001: Parallel generation with per-kid progress.
 * VAL-DAILY-012: Kid with no observations skipped with notice.
 * VAL-DAILY-013: Absent kid narrative reflects absence reason.
 * VAL-DAILY-015: Zero activities: generation proceeds with mood/appetite only.
 * VAL-DAILY-010: Snapshot saved on every generation.
 * VAL-DAILY-011: Re-generation upserts existing row, transitions to draft.
 */
export async function generateDailyReports(sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const sessionData = await db.query.termSession.findFirst({
    where: eq(termSession.id, sessionId),
  });

  if (!sessionData) {
    return { success: false as const, error: 'Sesi tidak ditemukan' };
  }

  const kids = await getEnrolledKidsForSession(sessionId);

  if (kids.length === 0) {
    return {
      success: false as const,
      error: 'Tidak ada murid terdaftar untuk sesi ini',
    };
  }

  const sessionDate = sessionData.date;

  // Generate reports in parallel for all kids
  const results: IReportResult[] = await Promise.all(
    kids.map(async (kidData) => {
      try {
        const structuredData = await getObservationData(
          kidData.id,
          sessionDate
        );

        // Skip if no observations
        if (!structuredData) {
          return {
            kidId: kidData.id,
            kidName: kidData.name,
            status: 'skipped' as const,
            message: 'Belum ada catatan observasi untuk Ananda ' + kidData.name,
          };
        }

        // Generate AI narrative
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

        // Upsert snapshot
        const existing = await db.query.dailyReportSnapshot.findFirst({
          where: and(
            eq(dailyReportSnapshot.kidId, kidData.id),
            eq(dailyReportSnapshot.sessionId, sessionId)
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
              sessionId,
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
 * If status is 'sent', transitions to 'stale'.
 * VAL-DAILY-005: Owner edits narrative textarea.
 * VAL-DAILY-009: Re-editing after sent changes status to stale.
 */
export async function updateDailyReportNarrative(
  kidId: string,
  sessionId: string,
  narrative: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = UpdateNarrativeSchema.safeParse({
    kidId,
    sessionId,
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
      eq(dailyReportSnapshot.sessionId, sessionId)
    ),
    columns: { id: true, status: true },
  });

  if (!report) {
    return { success: false as const, error: 'Laporan tidak ditemukan' };
  }

  // Determine new status: editing a sent report makes it stale
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
      sessionId: dailyReportSnapshot.sessionId,
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
 * VAL-DAILY-008: Mark as sent transitions status to sent.
 */
export async function markDailyReportSent(kidId: string, sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = MarkSentSchema.safeParse({ kidId, sessionId });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? 'Data tidak valid',
    };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.sessionId, sessionId)
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
      sessionId: dailyReportSnapshot.sessionId,
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
export async function getDailyReportDetail(kidId: string, sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const report = await db.query.dailyReportSnapshot.findFirst({
    where: and(
      eq(dailyReportSnapshot.kidId, kidId),
      eq(dailyReportSnapshot.sessionId, sessionId)
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

  // structuredJson is jsonb — Drizzle returns it as a parsed object
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
