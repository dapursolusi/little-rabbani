// GET /api/cron/seed-holidays
// POST /api/cron/seed-holidays
// Cron endpoint for syncing Indonesian national holidays from Google Calendar.
// Runs monthly on the 1st (Vercel Cron configured at deploy time).
import { NextResponse } from 'next/server';

import { syncHolidays } from '@/features/holiday/actions';

export async function GET() {
  try {
    const result = await syncHolidays();
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      inserted: result.data.inserted,
      deleted: result.data.deleted,
    });
  } catch (error) {
    console.error('[Cron Seed Holidays] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to sync holidays' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
