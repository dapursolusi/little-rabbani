'use server';

import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Demo-mode login — one-click Owner persona for the login page.
 *
 * Gated by NEXT_PUBLIC_DEMO_MODE=1 (dev only). Creates the demo owner
 * idempotently on first use, so no seed step is needed. The client then
 * calls /api/auth/dev-session (which enforces DEV_AUTH_BYPASS) to mint the
 * session cookie.
 */
export type DemoLoginResult =
  | { success: true; data: { email: string } }
  | { success: false; error: string };

const DEMO_OWNER_EMAIL =
  process.env.DEMO_OWNER_EMAIL ?? 'demo@littlerabbani.com';

export async function demoLoginAction(): Promise<DemoLoginResult> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== '1') {
    return { success: false, error: 'Demo mode is disabled.' };
  }

  let demoUser = await db.query.user.findFirst({
    where: eq(user.email, DEMO_OWNER_EMAIL),
  });

  if (!demoUser) {
    [demoUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: 'Demo Owner',
        email: DEMO_OWNER_EMAIL,
        emailVerified: true,
        role: 'owner',
      })
      .returning();
  }

  if (demoUser.role !== 'owner') {
    return {
      success: false,
      error: 'Demo user exists but is not an Owner.',
    };
  }

  return { success: true, data: { email: DEMO_OWNER_EMAIL } };
}
