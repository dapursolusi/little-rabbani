import { NextResponse } from 'next/server';

import { and, asc, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db';
import { scheduleItem, sessionType } from '@/lib/db/schema';

/**
 * GET /api/schedule/today
 *
 * Returns today's schedule items from active session types.
 * Used by the Teacher dashboard for polling (5-10s interval).
 */
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get active session types
    const activeTypes = await db.query.sessionType.findMany({
      where: and(eq(sessionType.active, true), isNull(sessionType.deletedAt)),
    });

    // Build session-like objects from active types
    const sessions = activeTypes.map((st) => ({
      id: st.id,
      date: today,
      startTime: st.start,
      endTime: st.end,
      label: st.name,
      scheduleItems: [] as Array<Record<string, unknown>>,
    }));

    // Load schedule items for each session
    for (const session of sessions) {
      const items = await db.query.scheduleItem.findMany({
        where: and(
          eq(scheduleItem.date, today),
          eq(scheduleItem.sessionTypeId, session.id),
          isNull(scheduleItem.deletedAt)
        ),
        orderBy: [asc(scheduleItem.sortOrder), asc(scheduleItem.createdAt)],
        with: {
          activity: true,
        },
      });
      session.scheduleItems = items;
    }

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Failed to fetch today schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat jadwal' },
      { status: 500 }
    );
  }
}
