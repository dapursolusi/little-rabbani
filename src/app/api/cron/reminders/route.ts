// GET /api/cron/reminders
// POST /api/cron/reminders
// Cron endpoint for processing reminders.
// Checks every 5 min (Vercel Cron configured at deploy time, tested via curl locally).
// VAL-REMIN-013: Endpoint responds to GET and POST.
import { NextResponse } from 'next/server';

import { processReminders } from '@/lib/reminder/processor';

export async function GET() {
  try {
    const result = await processReminders();
    return NextResponse.json({
      ok: true,
      remindersFired: result.capturePendingFired + result.scheduleEntryFired,
      capturePendingFired: result.capturePendingFired,
      scheduleEntryFired: result.scheduleEntryFired,
      cleanupDeleted: result.cleanupDeleted,
    });
  } catch (error) {
    console.error('[Cron Reminders] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
