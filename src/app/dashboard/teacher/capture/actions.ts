'use server';

import { headers } from 'next/headers';

import { db } from '@/db';
import { sessionType } from '@/db/schema';
import { and, asc, count, eq, ilike } from 'drizzle-orm';

import { auth } from '@/lib/auth';

/**
 * Get all session types for the teacher capture session picker.
 */
export async function getTeacherSessions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: 'redirect' };
  }

  const types = await db.query.sessionType.findMany({
    where: and(eq(sessionType.active, true)),
    orderBy: [asc(sessionType.start)],
  });

  return { success: true as const, data: types };
}

/**
 * Get filtered session types for the teacher capture session picker.
 */
export async function getTeacherSessionsFiltered(
  search: string,
  _dateFrom?: string,
  _dateTo?: string,
  page: number = 1,
  pageSize: number = 50
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: 'redirect' };
  }

  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof and>[] = [];
  if (search) {
    conditions.push(ilike(sessionType.name, `%${search}%`));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(sessionType)
      .where(where)
      .orderBy(asc(sessionType.start))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(sessionType).where(where),
  ]);

  return {
    success: true as const,
    data: rows,
    total: totalResult[0]?.count ?? 0,
  };
}
