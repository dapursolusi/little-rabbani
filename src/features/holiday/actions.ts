'use server';

import { HolidayFormSchema } from '@/features/holiday/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { holiday } from '@/lib/db/schema';

import { requireOwner } from '../../lib/actions/utils';

export async function getHolidays(termId?: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    const conditions = [isNull(holiday.deletedAt)];
    if (termId) {
      conditions.push(
        sql`(${holiday.termId} = ${termId} OR ${holiday.termId} IS NULL)`
      );
    }

    const where = and(...conditions);

    const items = await db.query.holiday.findMany({
      where,
      orderBy: (holiday, { asc }) => [asc(holiday.startDate)],
    });

    return { success: true as const, data: items };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data libur' };
  }
}

export async function createHoliday(input: Record<string, unknown>) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = HolidayFormSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newItem] = await db
      .insert(holiday)
      .values({
        termId: parsed.data.termId ?? null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        reason: parsed.data.reason,
        source: 'manual',
        scope: parsed.data.scope,
      })
      .returning();

    return { success: true as const, data: newItem };
  } catch {
    return { success: false as const, error: 'Gagal membuat hari libur' };
  }
}

export async function deleteHoliday(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    await db
      .update(holiday)
      .set({ deletedAt: new Date() })
      .where(eq(holiday.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus hari libur' };
  }
}
