import { NextRequest, NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { observation, observationActivity } from '@/lib/db/schema';

/**
 * GET /api/capture/participation?kidId=xxx&sessionId=yyy
 *
 * Returns existing Pass 2 participation data for a kid in a session.
 */
export async function GET(request: NextRequest) {
  try {
    const kidId = request.nextUrl.searchParams.get('kidId');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!kidId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Parameter kidId dan sessionId wajib diisi' },
        { status: 400 }
      );
    }

    // Find the observation
    const obs = await db.query.observation.findFirst({
      where: and(
        eq(observation.kidId, kidId),
        eq(observation.sessionId, sessionId)
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
