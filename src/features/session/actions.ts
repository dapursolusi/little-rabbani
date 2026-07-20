'use server';

import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { term, termSession } from '@/lib/db/schema';

import { requireOwner } from '../../lib/actions/utils';
import { SessionFormSchema } from './schema';

const DAYS_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// ─────────────── Session CRUD ───────────────

export async function getSessions(
  termId: string,
  params?: { search?: string; limit?: number; offset?: number }
) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const { search, limit = 50, offset = 0 } = params ?? {};

  const conditions = [
    eq(termSession.termId, termId),
    isNull(termSession.deletedAt),
  ];
  if (search) {
    conditions.push(
      sql`(${termSession.label}::text ILIKE ${`%${search}%`} OR ${termSession.date}::text ILIKE ${`%${search}%`})`
    );
  }
  const where = and(...conditions);

  const [sessions, totalResult] = await Promise.all([
    db.query.termSession.findMany({
      where,
      orderBy: (ts, { asc }) => [asc(ts.date), asc(ts.startTime)],
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(termSession)
      .where(where),
  ]);

  const total = totalResult?.[0]?.count ?? 0;
  return { success: true as const, data: sessions, total };
}

export async function getSession(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const result = await db.query.termSession.findFirst({
    where: eq(termSession.id, id),
  });

  if (!result) {
    return { success: false as const, error: 'Sesi tidak ditemukan' };
  }

  return { success: true as const, data: result };
}

export async function createSession(formData: FormData) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = SessionFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const isHoliday = parsed.data.isHoliday === 'true';
    const [newSession] = await db
      .insert(termSession)
      .values({
        termId: parsed.data.termId,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        label: parsed.data.label,
        isHoliday,
        holidayReason: isHoliday ? (parsed.data.holidayReason ?? null) : null,
      })
      .returning();

    return { success: true as const, data: newSession };
  } catch {
    return { success: false as const, error: 'Gagal membuat sesi' };
  }
}

export async function updateSession(id: string, formData: FormData) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = SessionFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const isHoliday = parsed.data.isHoliday === 'true';
    const [updated] = await db
      .update(termSession)
      .set({
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        label: parsed.data.label,
        isHoliday,
        holidayReason: isHoliday ? (parsed.data.holidayReason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(termSession.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Sesi tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui sesi' };
  }
}

/**
 * VAL-MASTER-030: Holiday override on a Session marks is_holiday and blocks schedule.
 * VAL-MASTER-031: Removing holiday override unblocks the Session.
 */
export async function updateSessionHoliday(
  id: string,
  data: { isHoliday: boolean; holidayReason: string | null }
) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    const [updated] = await db
      .update(termSession)
      .set({
        isHoliday: data.isHoliday,
        holidayReason: data.isHoliday ? data.holidayReason : null,
        label: data.isHoliday
          ? (data.holidayReason ?? 'Hari Libur')
          : 'Hari Libur (dibatalkan)',
        updatedAt: new Date(),
      })
      .where(eq(termSession.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Sesi tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui sesi' };
  }
}

export async function deleteSession(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    await db
      .update(termSession)
      .set({ deletedAt: new Date() })
      .where(eq(termSession.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus sesi' };
  }
}

// ─────────────── Recurring Session Generation ───────────────

/**
 * VAL-MASTER-027: Owner generates recurring Sessions from days-of-week.
 */
export async function generateRecurringSessions(
  termId: string,
  config: {
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    label: string;
  }
) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const termRecord = await db.query.term.findFirst({
    where: eq(term.id, termId),
  });

  if (!termRecord) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  const startDate = new Date(termRecord.startDate);
  const endDate = new Date(termRecord.endDate);
  const selectedDays = config.daysOfWeek.map((d) => DAYS_MAP[d.toLowerCase()]);

  const datesToCreate: Array<{
    termId: string;
    date: string;
    startTime: string;
    endTime: string;
    label: string;
  }> = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (selectedDays.includes(dayOfWeek)) {
      datesToCreate.push({
        termId,
        date: current.toISOString().split('T')[0],
        startTime: config.startTime,
        endTime: config.endTime,
        label: config.label,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  if (datesToCreate.length === 0) {
    return {
      success: false as const,
      error:
        'Tidak ada sesi yang dihasilkan. Periksa rentang tanggal dan hari yang dipilih.',
    };
  }

  try {
    await db.insert(termSession).values(datesToCreate);
    return {
      success: true as const,
      data: { count: datesToCreate.length },
    };
  } catch {
    return {
      success: false as const,
      error: 'Gagal membuat sesi berulang',
    };
  }
}
