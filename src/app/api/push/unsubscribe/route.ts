// POST /api/push/unsubscribe
// Removes a push subscription (marks as inactive).
// VAL-CROSS-023: Push subscription stored and removed.
import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pushSubscription } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    // Mark subscription as inactive instead of deleting (keep for audit)
    const existingSubs = await db
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.endpoint, endpoint))
      .limit(1);

    if (existingSubs.length > 0) {
      await db
        .update(pushSubscription)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscription.id, existingSubs[0].id));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Push Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
