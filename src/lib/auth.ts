import { db } from '@/db';
import * as schema from '@/db/schema';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      'localhost:3000',
      'lobo:3000',
      'little-rabbani.vercel.app',
      '*.vercel.app',
    ],
    protocol:
      process.env.NODE_ENV === 'production' ||
      !!process.env.VERCEL ||
      !!process.env.CI
        ? 'https'
        : 'http',
    fallback: process.env.NEXT_PUBLIC_APP_URL,
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      disableImplicitSignUp: false,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false,
      },
    },
  },
  onAPIError: {
    errorURL: '/login?error=access_denied',
  },
  plugins: [nextCookies()],
});
