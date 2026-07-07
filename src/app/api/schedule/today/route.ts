import { NextResponse } from 'next/server';

import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { scheduleItem, termSession } from '@/lib/db/schema';

/**
 * GET /api/schedule/today
 *
 * Returns today's non-holiday sessions with their schedule items.
 * Used by the Teacher dashboard for polling (5-10s interval).
 *
 * No auth guard — session cookie is validated, but the data is
 * intentionally readable by any authenticated user. Owner-only
 * mutations are enforced at the mutation level.
 */
export async function GET() {
  try {
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

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Failed to fetch today schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat jadwal' },
      { status: 500 }
    );
  }
}
