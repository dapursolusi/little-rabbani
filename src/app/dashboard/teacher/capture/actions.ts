'use server';

import { headers } from 'next/headers';

import { asc } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { termSession } from '@/lib/db/schema';

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
