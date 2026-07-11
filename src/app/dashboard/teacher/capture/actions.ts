'use server';

import { headers } from 'next/headers';

import { and, asc, count, eq, gte, ilike, lte, or } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { term, termSession } from '@/lib/db/schema';

/**
 * Get all sessions for the teacher capture session picker.
 */
export async function getTeacherSessions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: 'redirect' };
  }

  const sessions = await db.query.termSession.findMany({
    orderBy: [asc(termSession.date), asc(termSession.startTime)],
    with: {
      term: true,
    },
  });

  return { success: true as const, data: sessions };
}

/**
 * Get filtered/paginated sessions for the teacher capture session picker.
 * Supports text search (date, label, or term name), optional date range, and pagination.
 */
export async function getTeacherSessionsFiltered(
  search: string,
  dateFrom?: string,
  dateTo?: string,
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
    conditions.push(
      or(
        ilike(termSession.date, `%${search}%`),
        ilike(termSession.label, `%${search}%`),
        ilike(term.name, `%${search}%`)
      )
    );
  }
  if (dateFrom) {
    conditions.push(gte(termSession.date, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(termSession.date, dateTo));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(termSession)
      .leftJoin(term, eq(termSession.termId, term.id))
      .where(where)
      .orderBy(asc(termSession.date), asc(termSession.startTime))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(termSession)
      .leftJoin(term, eq(termSession.termId, term.id))
      .where(where),
  ]);

  const data = rows.map((r) => ({
    ...r.term_session,
    term: r.term,
  }));

  return {
    success: true as const,
    data,
    total: totalResult[0]?.count ?? 0,
  };
}
