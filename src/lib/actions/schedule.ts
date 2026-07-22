'use server';

import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod/v4';

import { db } from '@/lib/db';
import { scheduleItem, sessionType } from '@/lib/db/schema';

import { requireOwner } from './utils';

// ─────────────── Zod Schemas ───────────────

const CreateScheduleItemSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib dipilih'),
  sessionTypeId: z.string().min(1, 'Tipe sesi wajib dipilih'),
  sessionId: z.string().min(1),
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

/**
 * Check if a schedule is locked for the given date + session type.
 * Schedule edits are only allowed before the session start time.
 */
async function checkScheduleLock(
  date: string,
  sessionTypeId: string
): Promise<string | null> {
  const st = await db.query.sessionType.findFirst({
    where: eq(sessionType.id, sessionTypeId),
  });

  if (!st) {
    return 'Tipe sesi tidak ditemukan';
  }

  const startAt = new Date(`${date}T${st.start}`);
  const now = new Date();

  if (now >= startAt) {
    return 'Jadwal sudah tidak bisa diubah — sesi sudah dimulai';
  }

  return null;
}

// ─────────────── Read Operations ───────────────

/**
 * Get all schedule items for a given date + session type, ordered by sort_order.
 */
export async function getScheduleItems(date: string, sessionTypeId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const items = await db.query.scheduleItem.findMany({
    where: and(
      eq(scheduleItem.date, date),
      eq(scheduleItem.sessionTypeId, sessionTypeId),
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
 * Get all schedule items for a specific date (for owner schedule overview).
 * Returns items across all session types for the given date.
 */
export async function getScheduleItemsByDate(date: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const items = await db.query.scheduleItem.findMany({
    where: and(eq(scheduleItem.date, date), isNull(scheduleItem.deletedAt)),
    orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
    with: {
      activity: true,
      sessionType: true,
    },
  });

  return { success: true as const, data: items };
}

/**
 * Get schedule items for teacher dashboard (no role guard - accessible by both).
 * Returns schedule items for sessions happening today keyed by date directly.
 */
export async function getTodaySchedule() {
  const today = new Date().toISOString().split('T')[0];

  const items = await db.query.scheduleItem.findMany({
    where: and(eq(scheduleItem.date, today), isNull(scheduleItem.deletedAt)),
    orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
    with: {
      activity: true,
      sessionType: true,
    },
  });

  return { success: true as const, data: items };
}

/**
 * Get upcoming schedule items (next N days) for teacher dashboard.
 */
export async function getUpcomingSchedule() {
  const today = new Date().toISOString().split('T')[0];

  const items = await db.query.scheduleItem.findMany({
    where: isNull(scheduleItem.deletedAt),
    orderBy: [asc(scheduleItem.date), asc(scheduleItem.sortOrder)],
    with: {
      activity: true,
      sessionType: true,
    },
  });

  // Filter by date range
  const filtered = items.filter((i) => i.date && i.date >= today);

  return { success: true as const, data: filtered.slice(0, 20) };
}

// ─────────────── Mutations (Owner-only) ───────────────

/**
 * Create a schedule item for a (date, sessionTypeId) pair.
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

  // Check schedule lock
  const lockError = await checkScheduleLock(data.date, data.sessionTypeId);
  if (lockError) {
    return { success: false as const, error: lockError };
  }

  // Get the next sort order
  const existingItems = await db
    .select({ sortOrder: scheduleItem.sortOrder })
    .from(scheduleItem)
    .where(
      and(
        eq(scheduleItem.date, data.date),
        eq(scheduleItem.sessionTypeId, data.sessionTypeId)
      )
    )
    .orderBy(asc(scheduleItem.sortOrder));

  const nextSortOrder =
    existingItems.length > 0
      ? existingItems[existingItems.length - 1].sortOrder + 1
      : 0;

  try {
    const [newItem] = await db
      .insert(scheduleItem)
      .values({
        date: data.date,
        sessionTypeId: data.sessionTypeId,
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

  // Get the existing item to find date + sessionTypeId for lock check
  const existingItem = await db.query.scheduleItem.findFirst({
    where: eq(scheduleItem.id, data.id),
  });

  if (!existingItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  if (!existingItem.date || !existingItem.sessionTypeId) {
    return {
      success: false as const,
      error: 'Item jadwal belum memiliki data tanggal',
    };
  }

  // Check schedule lock
  const lockError = await checkScheduleLock(
    existingItem.date,
    existingItem.sessionTypeId
  );
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

  // Get the existing item to check lock
  const existingItem = await db.query.scheduleItem.findFirst({
    where: eq(scheduleItem.id, id),
  });

  if (!existingItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  if (!existingItem.date || !existingItem.sessionTypeId) {
    return {
      success: false as const,
      error: 'Item jadwal belum memiliki data tanggal',
    };
  }

  // Check schedule lock
  const lockError = await checkScheduleLock(
    existingItem.date,
    existingItem.sessionTypeId
  );
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

  // Check schedule lock for the first item
  const firstItem = await db.query.scheduleItem.findFirst({
    where: eq(scheduleItem.id, items[0].id),
  });

  if (!firstItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  if (!firstItem.date || !firstItem.sessionTypeId) {
    return {
      success: false as const,
      error: 'Item jadwal belum memiliki data tanggal',
    };
  }

  const lockError = await checkScheduleLock(
    firstItem.date,
    firstItem.sessionTypeId
  );
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
