'use server';

import { db } from '@/db';
import {
  dailyClassReport,
  dcrActivity,
  scheduleItem,
  sessionType,
} from '@/db/schema';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod/v4';

import { requireOwner } from '@/lib/actions/utils';

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
  date: z.string().min(1, 'Tanggal wajib diisi'),
  sessionTypeId: z.string().min(1, 'Tipe sesi wajib diisi'),
  learningNotes: z.string().optional().or(z.literal('')),
  activities: z.string().min(2, 'Aktivitas wajib diisi'), // JSON string
});

// ─────────────── Read Operations ───────────────

/**
 * Get an existing DCR for a (date, sessionTypeId), with activities.
 */
export async function getDcrBySession(date: string, sessionTypeId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const existing = await db.query.dailyClassReport.findFirst({
    where: and(
      eq(dailyClassReport.date, date),
      eq(dailyClassReport.sessionTypeId, sessionTypeId)
    ),
    with: {
      dcrActivities: {
        orderBy: [asc(dcrActivity.createdAt)],
      },
      sessionType: true,
    },
  });

  return { success: true as const, data: existing ?? null };
}

/**
 * Get schedule activities for a (date, sessionTypeId).
 */
export async function getScheduleActivitiesForDcr(
  date: string,
  sessionTypeId: string
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const items = await db.query.scheduleItem.findMany({
    where: and(
      eq(scheduleItem.startDate, date),
      eq(scheduleItem.sessionTypeId, sessionTypeId),
      isNull(scheduleItem.deletedAt)
    ),
    orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
    with: { subTheme: { with: { theme: true } } },
  });

  return { success: true as const, data: items };
}

/**
 * Get all DCR entries grouped by date+sessionTypeId.
 */
export async function getSessionsForDcr() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const types = await db.query.sessionType.findMany({
    where: and(eq(sessionType.active, true), isNull(sessionType.deletedAt)),
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

  const sessionsWithDcr = types.map((t) => {
    // ponytail: iterate all dates available in DCR
    const matchingDcrs = dcrRows.filter((d) => d.sessionTypeId === t.id);
    return { ...t, dcrs: matchingDcrs };
  });

  return { success: true as const, data: sessionsWithDcr };
}

/**
 * Get DCR activities for Pass 2 participation tracking.
 */
export async function getDcrActivitiesForPass2(dcrId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const activities = await db.query.dcrActivity.findMany({
    where: eq(dcrActivity.dcrId, dcrId),
    orderBy: [asc(dcrActivity.createdAt)],
  });

  return { success: true as const, data: activities };
}

/**
 * Get DCR by (date, sessionTypeId) for teacher Pass 2 check.
 */
export async function getDcrBySessionPublic(
  date: string,
  sessionTypeId: string
) {
  const existing = await db.query.dailyClassReport.findFirst({
    where: and(
      eq(dailyClassReport.date, date),
      eq(dailyClassReport.sessionTypeId, sessionTypeId)
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
 * Get DCR activities for Pass 2 - public version.
 */
export async function getDcrActivitiesForPass2Public(dcrId: string) {
  const activities = await db.query.dcrActivity.findMany({
    where: eq(dcrActivity.dcrId, dcrId),
    orderBy: [asc(dcrActivity.createdAt)],
  });

  return { success: true as const, data: activities };
}

// ─────────────── Mutations (Owner-only) ───────────────

/**
 * Save (create or update) a Daily Class Report.
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

  const {
    date,
    sessionTypeId,
    learningNotes,
    activities: activitiesJson,
  } = parsed.data;

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
    const existingDcr = await db.query.dailyClassReport.findFirst({
      where: and(
        eq(dailyClassReport.date, date),
        eq(dailyClassReport.sessionTypeId, sessionTypeId)
      ),
    });

    let dcrId: string;

    if (existingDcr) {
      dcrId = existingDcr.id;
      await db
        .update(dailyClassReport)
        .set({
          learningNotes: learningNotes || null,
          capturedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dailyClassReport.id, dcrId));

      await db.delete(dcrActivity).where(eq(dcrActivity.dcrId, dcrId));
    } else {
      const [newDcr] = await db
        .insert(dailyClassReport)
        .values({
          date,
          sessionTypeId,
          learningNotes: learningNotes || null,
          capturedBy: auth.userId,
          capturedAt: new Date(),
        })
        .returning();

      dcrId = newDcr.id;
    }

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

    const unplannedActivities = activities.filter(
      (a) => !a.wasPlanned && a.activityNameOther
    );

    return {
      success: true as const,
      data: {
        id: dcrId,
        date,
        sessionTypeId,
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
