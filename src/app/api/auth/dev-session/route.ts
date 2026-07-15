import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

import { db } from '@/lib/db';
import { session, user } from '@/lib/db/schema';

/**
 * Dev-mode only session bypass for testing authenticated routes without OAuth.
 *
 * Guarded by:
 *   1. NODE_ENV !== 'production' — never available in production
 *   2. DEV_AUTH_BYPASS env var set to '1' or 'true'
 *
 * POST /api/auth/dev-session
 * Body: { "email": "owner@littlerabbani.com" }
 *
 * Creates a BetterAuth-compatible session for the given user email and sets
 * the appropriate signed cookies so subsequent requests are authenticated.
 */
export async function POST(request: Request) {
  // --- Guards ---
  // Block only on real Vercel production. Allow local dev, CI, and Vercel preview.
  const isVercelProduction = process.env.VERCEL_ENV === 'production';
  if (isVercelProduction) {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const bypass = process.env.DEV_AUTH_BYPASS;
  if (!bypass || bypass === '0' || bypass === 'false') {
    return NextResponse.json(
      {
        error:
          'DEV_AUTH_BYPASS is not enabled. Set DEV_AUTH_BYPASS=1 in your environment.',
      },
      { status: 403 }
    );
  }

  // --- Parse body ---
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.email || typeof body.email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // --- Look up user ---
  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.email, body.email))
    .limit(1);

  if (!found) {
    return NextResponse.json(
      { error: `User not found for email: ${body.email}` },
      { status: 404 }
    );
  }

  // --- Create session ---
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [newSession] = await db
    .insert(session)
    .values({
      id: crypto.randomUUID(),
      userId: found.id,
      token: sessionToken,
      expiresAt,
    })
    .returning();

  if (!newSession) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }

  // --- Set BetterAuth-compatible signed cookie ---
  // BetterAuth defaults to "better-auth.session_token" cookie name
  // Hono's setSignedCookie signs value as: value.HMAC_SHA256(value), then URI-encodes
  // We replicate that here so getSession() can read and verify the cookie.
  const cookieName = 'better-auth.session_token';

  // HMAC-SHA256 sign the session token (matching Hono's cookie signing)
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.BETTER_AUTH_SECRET!),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(sessionToken)
  );
  const base64Sig = btoa(String.fromCharCode(...new Uint8Array(signature)));

  // Build the full Set-Cookie header matching Hono's serializeSigned output:
  //   name=encodeURIComponent(value.signature); Path=/; HttpOnly; SameSite=Lax; Max-Age=...
  const cookieValue = encodeURIComponent(`${sessionToken}.${base64Sig}`);
  const maxAgeSeconds = 7 * 24 * 60 * 60;

  const response = NextResponse.json({
    success: true,
    user: {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
    },
    session: {
      id: newSession.id,
      expiresAt: newSession.expiresAt,
    },
  });

  response.headers.append(
    'Set-Cookie',
    `${cookieName}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`
  );

  return response;
}
