'use server';

import { db } from '@/db';
import { calendarEvent, sessionType } from '@/db/schema';
import { and, asc, eq, gte, isNull } from 'drizzle-orm';
import { z } from 'zod/v4';

import { requireOwner } from '@/lib/actions/utils';

// ─────────────── Zod Schemas ───────────────

const CreateCalendarEventSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib dipilih'),
  sessionTypeId: z.string().min(1, 'Tipe sesi wajib dipilih'),
  sessionId: z.string().min(1),
  subThemeId: z.string().uuid().optional().or(z.literal('')),
  indoor: z.string().optional(),
  name: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  itemsToBring: z.string().optional().or(z.literal('')),
  permissionRequired: z.string().optional(),
  sortOrder: z.string().optional(),
});

const UpdateCalendarEventSchema = z.object({
  id: z.string().min(1),
  subThemeId: z.string().uuid().optional().or(z.literal('')),
  indoor: z.string().optional(),
  name: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  itemsToBring: z.string().optional().or(z.literal('')),
  permissionRequired: z.string().optional(),
  sortOrder: z.string().optional(),
});

const DeleteCalendarEventSchema = z.object({
  id: z.string().min(1),
});

// ─────────────── Helpers ───────────────

/**
 * Check if a calendar event is locked for the given date + session type.
 * Edits are only allowed before the session start time.
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
 * Get all calendar events for a given date + session type, ordered by sort_order.
 */
export async function getCalendarEvents(date: string, sessionTypeId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const items = await db.query.calendarEvent.findMany({
    where: and(
      eq(calendarEvent.startDate, date),
      eq(calendarEvent.sessionTypeId, sessionTypeId),
      isNull(calendarEvent.deletedAt)
    ),
    orderBy: [asc(calendarEvent.sortOrder), asc(calendarEvent.createdAt)],
    with: {
      subTheme: {
        with: {
          theme: true,
        },
      },
    },
  });

  return { success: true as const, data: items };
}

/**
 * Get all calendar events for a specific date (for owner schedule overview).
 * Returns events across all session types for the given date.
 */
export async function getCalendarEventsByDate(date: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const items = await db.query.calendarEvent.findMany({
    where: and(
      eq(calendarEvent.startDate, date),
      isNull(calendarEvent.deletedAt)
    ),
    orderBy: [asc(calendarEvent.sortOrder), asc(calendarEvent.createdAt)],
    with: {
      subTheme: {
        with: {
          theme: true,
        },
      },
      sessionType: true,
    },
  });

  return { success: true as const, data: items };
}

/**
 * Get calendar events for teacher dashboard (no role guard - accessible by both).
 * Returns events for sessions happening today keyed by date directly.
 */
export async function getTodayCalendar() {
  const today = new Date().toISOString().split('T')[0];

  const items = await db.query.calendarEvent.findMany({
    where: and(
      eq(calendarEvent.startDate, today),
      isNull(calendarEvent.deletedAt)
    ),
    orderBy: [asc(calendarEvent.sortOrder), asc(calendarEvent.createdAt)],
    with: {
      subTheme: {
        with: {
          theme: true,
        },
      },
      sessionType: true,
    },
  });

  return { success: true as const, data: items };
}

/**
 * Get upcoming calendar events (next N days) for teacher dashboard.
 */
export async function getUpcomingCalendar() {
  const today = new Date().toISOString().split('T')[0];

  const items = await db.query.calendarEvent.findMany({
    where: and(
      isNull(calendarEvent.deletedAt),
      gte(calendarEvent.startDate, today)
    ),
    orderBy: [asc(calendarEvent.startDate), asc(calendarEvent.sortOrder)],
    with: {
      subTheme: {
        with: {
          theme: true,
        },
      },
      sessionType: true,
    },
  });

  return { success: true as const, data: items.slice(0, 20) };
}

// ─────────────── Mutations (Owner-only) ───────────────

/**
 * Create a calendar event for a (date, sessionTypeId) pair.
 * VAL-CAPTURE-001: Owner creates calendar event with sub-theme.
 * VAL-CAPTURE-002: Owner creates calendar event with indoor/outdoor setting.
 * VAL-CAPTURE-004: Event editable until session start time.
 */
export async function createCalendarEvent(
  input: FormData | Record<string, unknown>
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = CreateCalendarEventSchema.safeParse(rawData);

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
    .select({ sortOrder: calendarEvent.sortOrder })
    .from(calendarEvent)
    .where(
      and(
        eq(calendarEvent.startDate, data.date),
        eq(calendarEvent.sessionTypeId, data.sessionTypeId)
      )
    )
    .orderBy(asc(calendarEvent.sortOrder));

  const nextSortOrder =
    existingItems.length > 0
      ? existingItems[existingItems.length - 1].sortOrder + 1
      : 0;

  try {
    const [newItem] = await db
      .insert(calendarEvent)
      .values({
        startDate: data.date,
        endDate: data.date,
        sessionTypeId: data.sessionTypeId,
        subThemeId: data.subThemeId || null,
        indoor: data.indoor === 'true',
        name: data.name || '',
        location: data.location || null,
        itemsToBring: data.itemsToBring || null,
        permissionRequired: data.permissionRequired === 'true',
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
 * Update a calendar event.
 * VAL-CAPTURE-005: Owner adds activity to calendar event mid-week.
 * VAL-CAPTURE-006: Owner swaps activity between calendar slots.
 */
export async function updateCalendarEvent(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = UpdateCalendarEventSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const data = parsed.data;

  // Get the existing item to find date + sessionTypeId for lock check
  const existingItem = await db.query.calendarEvent.findFirst({
    where: eq(calendarEvent.id, data.id),
  });

  if (!existingItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  if (!existingItem.startDate || !existingItem.sessionTypeId) {
    return {
      success: false as const,
      error: 'Item jadwal belum memiliki data tanggal',
    };
  }

  // Check schedule lock
  const lockError = await checkScheduleLock(
    existingItem.startDate,
    existingItem.sessionTypeId
  );
  if (lockError) {
    return { success: false as const, error: lockError };
  }

  try {
    const [updated] = await db
      .update(calendarEvent)
      .set({
        subThemeId: data.subThemeId || null,
        indoor: data.indoor === 'true',
        name: data.name || '',
        location: data.location || null,
        itemsToBring: data.itemsToBring || null,
        permissionRequired: data.permissionRequired === 'true',
        sortOrder: data.sortOrder
          ? parseInt(data.sortOrder)
          : existingItem.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvent.id, data.id))
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
 * Delete a calendar event.
 * VAL-CAPTURE-007: Owner deletes calendar event.
 */
export async function deleteCalendarEvent(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = DeleteCalendarEventSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { id } = parsed.data;

  // Get the existing item to check lock
  const existingItem = await db.query.calendarEvent.findFirst({
    where: eq(calendarEvent.id, id),
  });

  if (!existingItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  if (!existingItem.startDate || !existingItem.sessionTypeId) {
    return {
      success: false as const,
      error: 'Item jadwal belum memiliki data tanggal',
    };
  }

  // Check schedule lock
  const lockError = await checkScheduleLock(
    existingItem.startDate,
    existingItem.sessionTypeId
  );
  if (lockError) {
    return { success: false as const, error: lockError };
  }

  try {
    await db
      .update(calendarEvent)
      .set({ deletedAt: new Date() })
      .where(eq(calendarEvent.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return {
      success: false as const,
      error: 'Gagal menghapus item jadwal',
    };
  }
}

/**
 * Reorder calendar events (swap sort orders).
 */
export async function reorderCalendarEvents(
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
  const firstItem = await db.query.calendarEvent.findFirst({
    where: eq(calendarEvent.id, items[0].id),
  });

  if (!firstItem) {
    return { success: false as const, error: 'Item jadwal tidak ditemukan' };
  }

  if (!firstItem.startDate || !firstItem.sessionTypeId) {
    return {
      success: false as const,
      error: 'Item jadwal belum memiliki data tanggal',
    };
  }

  const lockError = await checkScheduleLock(
    firstItem.startDate,
    firstItem.sessionTypeId
  );
  if (lockError) {
    return { success: false as const, error: lockError };
  }

  try {
    for (const item of items) {
      await db
        .update(calendarEvent)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(calendarEvent.id, item.id));
    }

    return { success: true as const, data: undefined };
  } catch {
    return {
      success: false as const,
      error: 'Gagal mengurutkan ulang jadwal',
    };
  }
}
