'use server';

import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod/v4';

import { requireOwner } from '@/lib/actions/utils';
import { db } from '@/lib/db';
import {
  activity,
  dailyClassReport,
  dcrActivity,
  scheduleItem,
  sessionType,
  termSession,
} from '@/lib/db/schema';
import { resolveSessionType } from '@/lib/session-type-resolver';

/**
 * Resolve a sessionId to its (date, sessionTypeId) pair.
 * Used internally by DCR actions to re-key lookups.
 */
async function resolveSessionKey(sessionId: string) {
  const ts = await db.query.termSession.findFirst({
    where: eq(termSession.id, sessionId),
  });
  if (!ts) return null;

  const allTypes = await db.query.sessionType.findMany({
    where: isNull(sessionType.deletedAt),
  });
  const resolved = resolveSessionType(allTypes, ts.label, ts.date);
  if (!resolved) return null;

  return { date: ts.date, sessionTypeId: resolved.id };
}

// ─────────────── Zod Schemas ───────────────

const ActivityDeviationEnum = z.enum(['done', 'skipped', 'modified']);

const DcrActivityInputSchema = z.object({
  activityId: z.string().nullable().optional(),
  activityNameOther: z.string().nullable().optional(),
  deviation: ActivityDeviationEnum,
  wasPlanned: z.boolean(),
});

type TDcrActivityInput = z.infer<typeof DcrActivityInputSchema>;

const SaveDcrSchema = z.object({
  sessionId: z.string().min(1, 'Sesi wajib dipilih'),
  learningNotes: z.string().optional().or(z.literal('')),
  activities: z.string().min(2, 'Aktivitas wajib diisi'), // JSON string
});

// ─────────────── Read Operations ───────────────

/**
 * Get an existing DCR for a session, with activities.
 * Returns null if no DCR exists for this session.
 * VAL-CAPTURE-015: One DCR per session (check if exists).
 */
export async function getDcrBySession(sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const key = await resolveSessionKey(sessionId);
  if (!key) {
    // If session can't be resolved, fall back to sessionId lookup
    const existing = await db.query.dailyClassReport.findFirst({
      where: eq(dailyClassReport.sessionId, sessionId),
      with: {
        dcrActivities: {
          orderBy: [asc(dcrActivity.createdAt)],
          with: {
            activity: true,
          },
        },
        session: true,
      },
    });
    return { success: true as const, data: existing ?? null };
  }

  const existing = await db.query.dailyClassReport.findFirst({
    where: and(
      eq(dailyClassReport.date, key.date),
      eq(dailyClassReport.sessionTypeId, key.sessionTypeId)
    ),
    with: {
      dcrActivities: {
        orderBy: [asc(dcrActivity.createdAt)],
        with: {
          activity: true,
        },
      },
      session: true,
    },
  });

  return { success: true as const, data: existing ?? null };
}

/**
 * Get schedule activities for a session (for prefilling DCR).
 * VAL-CAPTURE-010: Activities prefilled from schedule.
 * VAL-CAPTURE-016: Session without schedule shows empty state.
 */
export async function getScheduleActivitiesForDcr(sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  // Resolve sessionId -> (date, sessionTypeId) via termSession
  const ts = await db.query.termSession.findFirst({
    where: eq(termSession.id, sessionId),
  });

  if (!ts) {
    return { success: true as const, data: [] };
  }

  // Resolve session type from the termSession's label + date
  const allTypes = await db.query.sessionType.findMany({
    where: isNull(sessionType.deletedAt),
  });
  const resolved = resolveSessionType(allTypes, ts.label, ts.date);

  if (!resolved) {
    // Fallback: query by sessionId FK (old key, still valid until contract phase)
    const items = await db.query.scheduleItem.findMany({
      where: eq(scheduleItem.sessionId, sessionId),
      orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
      with: { activity: true },
    });
    return { success: true as const, data: items };
  }

  const items = await db.query.scheduleItem.findMany({
    where: and(
      eq(scheduleItem.date, ts.date),
      eq(scheduleItem.sessionTypeId, resolved.id),
      isNull(scheduleItem.deletedAt)
    ),
    orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
    with: { activity: true },
  });

  return { success: true as const, data: items };
}

/**
 * Get all sessions with their DCR status.
 * Used for the DCR session picker page.
 */
export async function getSessionsForDcr() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const sessions = await db.query.termSession.findMany({
    orderBy: [asc(termSession.date), asc(termSession.startTime)],
    with: {
      term: true,
    },
  });

  // Build a map of sessions resolved to (date, sessionTypeId) for DCR lookup
  const allTypes = await db.query.sessionType.findMany({
    where: isNull(sessionType.deletedAt),
  });

  const dcrRows = await db.query.dailyClassReport.findMany({
    columns: {
      id: true,
      date: true,
      sessionTypeId: true,
      capturedAt: true,
      learningNotes: true,
    },
  });

  // Key by date:sessionTypeId
  const dcrByKey = new Map(
    dcrRows.map((dcr) => [`${dcr.date}:${dcr.sessionTypeId}`, dcr])
  );

  // Pre-resolve session keys so we can look up by the new key
  const sessionKeyMap = new Map(
    sessions.map((s) => {
      const resolved = resolveSessionType(allTypes, s.label, s.date);
      return [s.id, resolved ? `${s.date}:${resolved.id}` : null];
    })
  );

  // Attach DCR info to each session
  const sessionsWithDcr = sessions.map((session) => {
    const key = sessionKeyMap.get(session.id);
    const dcr = key ? (dcrByKey.get(key) ?? null) : null;
    return { ...session, dcr };
  });

  return { success: true as const, data: sessionsWithDcr };
}

/**
 * Get DCR activities for Pass 2 participation tracking.
 * This includes both planned and unplanned activities.
 * VAL-CAPTURE-014: Unplanned activities flow into Pass 2.
 */
export async function getDcrActivitiesForPass2(dcrId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const activities = await db.query.dcrActivity.findMany({
    where: eq(dcrActivity.dcrId, dcrId),
    orderBy: [asc(dcrActivity.createdAt)],
    with: {
      activity: true,
    },
  });

  return { success: true as const, data: activities };
}

/**
 * Get DCR by session ID for teacher Pass 2 check.
 * No role guard - accessible by both Owner and Teacher.
 * Returns null if no DCR exists.
 */
export async function getDcrBySessionPublic(sessionId: string) {
  const key = await resolveSessionKey(sessionId);
  if (!key) {
    // Fallback: sessionId lookup if session type can't be resolved
    const existing = await db.query.dailyClassReport.findFirst({
      where: eq(dailyClassReport.sessionId, sessionId),
      columns: {
        id: true,
        sessionId: true,
        capturedAt: true,
      },
    });
    return { success: true as const, data: existing ?? null };
  }

  const existing = await db.query.dailyClassReport.findFirst({
    where: and(
      eq(dailyClassReport.date, key.date),
      eq(dailyClassReport.sessionTypeId, key.sessionTypeId)
    ),
    columns: {
      id: true,
      date: true,
      sessionTypeId: true,
      capturedAt: true,
    },
  });

  return { success: true as const, data: existing ?? null };
}

/**
 * Get DCR activities for Pass 2 - public version accessible by teacher.
 */
export async function getDcrActivitiesForPass2Public(dcrId: string) {
  const activities = await db.query.dcrActivity.findMany({
    where: eq(dcrActivity.dcrId, dcrId),
    orderBy: [asc(dcrActivity.createdAt)],
    with: {
      activity: true,
    },
  });

  return { success: true as const, data: activities };
}

// ─────────────── Mutations (Owner-only) ───────────────

/**
 * Save (create or update) a Daily Class Report.
 * VAL-CAPTURE-010: Save DCR with prefilled activities.
 * VAL-CAPTURE-011: Deviation tracking (done/skipped/modified).
 * VAL-CAPTURE-012: Add unplanned activities.
 * VAL-CAPTURE-015: One DCR per session (upsert).
 */
export async function saveDcr(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = SaveDcrSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { sessionId, learningNotes, activities: activitiesJson } = parsed.data;

  // Parse activities JSON
  let activities: TDcrActivityInput[];
  try {
    const parsedActivities = JSON.parse(activitiesJson);
    const result = z.array(DcrActivityInputSchema).safeParse(parsedActivities);
    if (!result.success) {
      return {
        success: false as const,
        error: 'Data aktivitas tidak valid',
      };
    }
    activities = result.data as TDcrActivityInput[];
  } catch {
    return {
      success: false as const,
      error: 'Data aktivitas tidak valid',
    };
  }

  if (activities.length === 0) {
    return {
      success: false as const,
      error: 'Setidaknya satu aktivitas diperlukan',
    };
  }

  try {
    // Resolve (date, sessionTypeId) from sessionId
    const key = await resolveSessionKey(sessionId);
    if (!key) {
      return {
        success: false as const,
        error: 'Sesi tidak ditemukan atau tipe sesi tidak dapat diidentifikasi',
      };
    }

    // Check if DCR already exists for this (date, sessionTypeId)
    const existingDcr = await db.query.dailyClassReport.findFirst({
      where: and(
        eq(dailyClassReport.date, key.date),
        eq(dailyClassReport.sessionTypeId, key.sessionTypeId)
      ),
    });

    let dcrId: string;

    if (existingDcr) {
      // Update existing DCR
      dcrId = existingDcr.id;
      await db
        .update(dailyClassReport)
        .set({
          learningNotes: learningNotes || null,
          capturedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dailyClassReport.id, dcrId));

      // Delete old DCR activities
      await db.delete(dcrActivity).where(eq(dcrActivity.dcrId, dcrId));
    } else {
      // Create new DCR
      const [newDcr] = await db
        .insert(dailyClassReport)
        .values({
          sessionId,
          date: key.date,
          sessionTypeId: key.sessionTypeId,
          learningNotes: learningNotes || null,
          capturedBy: auth.userId,
          capturedAt: new Date(),
        })
        .returning();

      dcrId = newDcr.id;
    }

    // Insert DCR activities
    const dcrActivityValues = activities.map((act) => ({
      dcrId,
      activityId: act.activityId || null,
      activityNameOther: act.activityNameOther || null,
      deviation: act.deviation,
      wasPlanned: act.wasPlanned,
    }));

    if (dcrActivityValues.length > 0) {
      await db.insert(dcrActivity).values(dcrActivityValues).returning();
    }

    // Identify unplanned activities for prompt-to-add-to-catalog
    const unplannedActivities = activities.filter(
      (a) => !a.wasPlanned && a.activityNameOther
    );

    return {
      success: true as const,
      data: {
        id: dcrId,
        sessionId,
        unplannedActivities,
      },
    };
  } catch (error) {
    console.error('Gagal menyimpan laporan kelas:', error);
    return {
      success: false as const,
      error: 'Gagal menyimpan laporan kelas',
    };
  }
}

/**
 * Create an activity from an unplanned DCR activity name.
 * Used by the prompt-to-add-to-catalog flow.
 * VAL-CAPTURE-013: Unplanned activity triggers prompt-to-add-to-catalog.
 */
export async function createActivityFromUnplanned(
  name: string,
  category: string = 'lainnya'
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  if (!name.trim()) {
    return { success: false as const, error: 'Nama aktivitas wajib diisi' };
  }

  try {
    const [newActivity] = await db
      .insert(activity)
      .values({
        name: name.trim(),
        category: category as (typeof activity.$inferInsert)['category'],
      })
      .returning();

    return { success: true as const, data: newActivity };
  } catch {
    return {
      success: false as const,
      error: 'Gagal menambahkan aktivitas ke katalog',
    };
  }
}
