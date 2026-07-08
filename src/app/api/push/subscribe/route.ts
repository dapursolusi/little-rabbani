// POST /api/push/subscribe
// Stores a push subscription for the authenticated user.
// VAL-CROSS-023: Push subscription stored in DB.
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
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      );
    }

    // Check if subscription with this endpoint already exists
    const existingSubs = await db
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.endpoint, endpoint))
      .limit(1);

    if (existingSubs.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscription)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
          isActive: true,
          userId: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscription.id, existingSubs[0].id));
    } else {
      // Insert new subscription
      await db.insert(pushSubscription).values({
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        isActive: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
