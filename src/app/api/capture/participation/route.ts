import { NextRequest, NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { observation, observationActivity, termSession } from '@/lib/db/schema';

/**
 * GET /api/capture/participation?kidId=xxx&date=yyyy-mm-dd
 *
 * Returns existing Pass 2 participation data for a kid on a given date.
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userSession = await auth.api.getSession({
      headers: request.headers,
    });

    if (!userSession) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const kidId = request.nextUrl.searchParams.get('kidId');
    const dateParam = request.nextUrl.searchParams.get('date');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!kidId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kidId wajib diisi' },
        { status: 400 }
      );
    }

    // Resolve date from explicit date param or from sessionId
    let resolvedDate: string;
    if (dateParam) {
      resolvedDate = dateParam;
    } else if (sessionId) {
      const session = await db.query.termSession.findFirst({
        where: eq(termSession.id, sessionId),
        columns: { date: true },
      });
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Sesi tidak ditemukan' },
          { status: 400 }
        );
      }
      resolvedDate = session.date;
    } else {
      return NextResponse.json(
        { success: false, error: 'Parameter date atau sessionId wajib diisi' },
        { status: 400 }
      );
    }

    // Find the observation by kidId + date
    const obs = await db.query.observation.findFirst({
      where: and(
        eq(observation.kidId, kidId),
        eq(observation.date, resolvedDate)
      ),
    });

    if (!obs) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get participation
    const activities = await db.query.observationActivity.findMany({
      where: eq(observationActivity.observationId, obs.id),
    });

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    console.error('Failed to fetch participation:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat partisipasi' },
      { status: 500 }
    );
  }
}
