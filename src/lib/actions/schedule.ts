'use server';

import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod/v4';

import { db } from '@/lib/db';
import { scheduleItem, termSession } from '@/lib/db/schema';

import { requireOwner } from './utils';

// ─────────────── Zod Schemas ───────────────

const CreateScheduleItemSchema = z.object({
  sessionId: z.string().min(1, 'Sesi wajib dipilih'),
  activityId: z.string().optional().or(z.literal('')),
  type: z.enum(['activity', 'outing']),
  outingLocation: z.string().optional().or(z.literal('')),
  outingBringItems: z.string().optional().or(z.literal('')),
  outingPermissionRequired: z.string().optional(),
  sortOrder: z.string().optional(),
});

const UpdateScheduleItemSchema = z.object({
  id: z.string().min(1),
  activityId: z.string().optional().or(z.literal('')),
  type: z.enum(['activity', 'outing']),
  outingLocation: z.string().optional().or(z.literal('')),
  outingBringItems: z.string().optional().or(z.literal('')),
  outingPermissionRequired: z.string().optional(),
  sortOrder: z.string().optional(),
});

const DeleteScheduleItemSchema = z.object({
  id: z.string().min(1),
});

// ─────────────── Helpers ───────────────

function getSessionDateTime(session: {
  date: string;
  startTime: string;
  endTime: string;
}): { startAt: Date; endAt: Date } {
  const startAt = new Date(`${session.date}T${session.startTime}`);
  const endAt = new Date(`${session.date}T${session.endTime}`);
  return { startAt, endAt };
}

/**
 * Check if a session is locked (start time has passed).
 * Schedule edits are only allowed before session start time.
 */
async function checkSessionLock(sessionId: string): Promise<string | null> {
  const session = await db.query.termSession.findFirst({
    where: eq(termSession.id, sessionId),
  });

  if (!session) {
    return 'Sesi tidak ditemukan';
  }

  const { startAt } = getSessionDateTime(session);
  const now = new Date();

  if (now >= startAt) {
    return 'Jadwal sudah tidak bisa diubah — sesi sudah dimulai';
  }

  return null;
}

// ─────────────── Read Operations ───────────────

/**
 * Get all schedule items for a given session, ordered by sort_order.
 */
export async function getScheduleItems(sessionId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const items = await db.query.scheduleItem.findMany({
    where: and(
      eq(scheduleItem.sessionId, sessionId),
      isNull(scheduleItem.deletedAt)
    ),
    orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
    with: {
      activity: true,
    },
  });

  return { success: true as const, data: items };
}

/**
 * Get schedule items for teacher dashboard (no role guard - accessible by both).
 * Returns schedule items for sessions happening today.
 * The session must NOT be a holiday.
 */
export async function getTodaySchedule() {
  const today = new Date().toISOString().split('T')[0];

  const sessions = await db.query.termSession.findMany({
    where: and(eq(termSession.date, today), eq(termSession.isHoliday, false)),
    orderBy: [asc(termSession.startTime)],
    with: {
      scheduleItems: {
        orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
        with: {
          activity: true,
        },
      },
    },
  });

  return { success: true as const, data: sessions };
}

/**
 * Get upcoming schedule items (next N days) for teacher dashboard.
 */
export async function getUpcomingSchedule() {
  const today = new Date().toISOString().split('T')[0];

  const sessions = await db.query.termSession.findMany({
    where: and(
      eq(termSession.isHoliday, false)
      // We'll get sessions from today onwards
    ),
    orderBy: [asc(termSession.date), asc(termSession.startTime)],
    with: {
      scheduleItems: {
        orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
        with: {
          activity: true,
        },
      },
    },
  });

  // Filter by date range
  const filtered = sessions.filter((s) => {
    return s.date >= today;
  });

  return { success: true as const, data: filtered.slice(0, 20) };
}

/**
 * Check if a session is a holiday.
 */
export async function isSessionHoliday(sessionId: string) {
  const session = await db.query.termSession.findFirst({
    where: eq(termSession.id, sessionId),
  });

  return session?.isHoliday ?? false;
}

// ─────────────── Mutations (Owner-only) ───────────────

/**
 * Create a schedule item for a session.
 * VAL-CAPTURE-001: Owner creates schedule item with catalog activity.
 * VAL-CAPTURE-002: Owner creates schedule item with outing.
 * VAL-CAPTURE-004: Schedule editable until session start time.
 */
export async function createScheduleItem(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = CreateScheduleItemSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const data = parsed.data;

  // Check if session is holiday
  const session = await db.query.termSession.findFirst({
    where: eq(termSession.id, data.sessionId),
  });

  if (!session) {
    return { success: false as const, error: 'Sesi tidak ditemukan' };
  }

  if (session.isHoliday) {
    return {
      success: false as const,
      error: 'Tidak bisa menambahkan jadwal ke hari libur',
    };
  }

  // Check session lock
  const lockError = await checkSessionLock(data.sessionId);
  if (lockError) {
    return { success: false as const, error: lockError };
  }

  // Get the next sort order
  const existingItems = await db
    .select({ sortOrder: scheduleItem.sortOrder })
    .from(scheduleItem)
    .where(eq(scheduleItem.sessionId, data.sessionId))
    .orderBy(asc(scheduleItem.sortOrder));

  const nextSortOrder =
    existingItems.length > 0
      ? existingItems[existingItems.length - 1].sortOrder + 1
      : 0;

  try {
    const [newItem] = await db
      .insert(scheduleItem)
      .values({
        sessionId: data.sessionId,
        activityId: data.activityId || null,
        type: data.type,
        outingLocation: data.outingLocation || null,
        outingBringItems: data.outingBringItems || null,
        outingPermissionRequired: data.outingPermissionRequired === 'true',
        sortOrder: data.sortOrder ? parseInt(data.sortOrder) : nextSortOrder,
      })
      .returning();

    return { success: true as const, data: newItem };
  } catch {
    return {
      success: false as const,
      error: 'Gagal menambahkan item jadwal',
    };
  }
}

/**
 * Update a schedule item.
 * VAL-CAPTURE-005: Owner adds activity to schedule item mid-week.
 * VAL-CAPTURE-006: Owner swaps activity between schedule slots.
 */
export async function updateScheduleItem(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = UpdateScheduleItemSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const data = parsed.data;

  // Get the existing item to find the session
  const existingItem = await db.query.scheduleItem.findFirst({
    where: eq(scheduleItem.id, data.id),
  });

  if (!existingItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  // Check session lock
  const lockError = await checkSessionLock(existingItem.sessionId);
  if (lockError) {
    return { success: false as const, error: lockError };
  }

  try {
    const [updated] = await db
      .update(scheduleItem)
      .set({
        activityId: data.activityId || null,
        type: data.type,
        outingLocation: data.outingLocation || null,
        outingBringItems: data.outingBringItems || null,
        outingPermissionRequired: data.outingPermissionRequired === 'true',
        sortOrder: data.sortOrder
          ? parseInt(data.sortOrder)
          : existingItem.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(scheduleItem.id, data.id))
      .returning();

    return { success: true as const, data: updated };
  } catch {
    return {
      success: false as const,
      error: 'Gagal memperbarui item jadwal',
    };
  }
}

/**
 * Delete a schedule item.
 * VAL-CAPTURE-007: Owner deletes schedule item.
 */
export async function deleteScheduleItem(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = DeleteScheduleItemSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { id } = parsed.data;

  // Get the existing item
  const existingItem = await db.query.scheduleItem.findFirst({
    where: eq(scheduleItem.id, id),
  });

  if (!existingItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  // Check session lock
  const lockError = await checkSessionLock(existingItem.sessionId);
  if (lockError) {
    return { success: false as const, error: lockError };
  }

  try {
    await db
      .update(scheduleItem)
      .set({ deletedAt: new Date() })
      .where(eq(scheduleItem.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return {
      success: false as const,
      error: 'Gagal menghapus item jadwal',
    };
  }
}

/**
 * Reorder schedule items (swap sort orders).
 */
export async function reorderScheduleItems(
  items: Array<{ id: string; sortOrder: number }>
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  if (items.length === 0) {
    return { success: true as const, data: undefined };
  }

  // Check session lock for the first item's session
  const firstItem = await db.query.scheduleItem.findFirst({
    where: eq(scheduleItem.id, items[0].id),
  });

  if (!firstItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  const lockError = await checkSessionLock(firstItem.sessionId);
  if (lockError) {
    return { success: false as const, error: lockError };
  }

  try {
    for (const item of items) {
      await db
        .update(scheduleItem)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(scheduleItem.id, item.id));
    }

    return { success: true as const, data: undefined };
  } catch {
    return {
      success: false as const,
      error: 'Gagal mengurutkan ulang jadwal',
    };
  }
}
