import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { observation, observationActivity } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';

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

    if (!kidId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kidId wajib diisi' },
        { status: 400 }
      );
    }

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Parameter date wajib diisi' },
        { status: 400 }
      );
    }

    // Find the observation by kidId + date
    const obs = await db.query.observation.findFirst({
      where: and(eq(observation.kidId, kidId), eq(observation.date, dateParam)),
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
