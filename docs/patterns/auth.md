# Auth Patterns

## Stack

Better Auth (`better-auth` + `@better-auth/drizzle-adapter`). Google OAuth + dev-session bypass.

## Configuration

`src/lib/auth.ts` — `betterAuth()` setup with:

- Drizzle adapter (`provider: 'pg'`)
- Google social provider
- Allowed hosts (localhost, lobo, vercel)
- `role` as additional user field (not editable by user)
- `nextCookies()` plugin

## Auth gating — UNDECIDED

`requireOwner()` (`src/lib/actions/require-owner.ts`) currently gates mutations: redirects to `/login` if unauthenticated, returns `{ success: false, message: 'Akses ditolak...' }` if role is not `owner`.

**Placement is not settled.** Call sites are split between services-level (majority) and action-level (newest modules), and a future `roleGate(['owner', 'teacher'])`-style design may replace the current gate. Do not write new requireOwner call-site guidance; track drift in violations.md until the design lands.

## Route proxy

`src/proxy.ts` — middleware handling:

1. Distributed tracing headers (`X-Request-Id`, `X-Trace-Id`)
2. Session checking for `/dashboard/*` routes
3. Role-based access: `ROLE_ROUTES` map defines which routes each role can access
4. Root path redirect: unauthenticated → `/login`, authenticated → role home
5. Teacher-preview mode (`?teacher-preview=true` in dev) for testing teacher role

```ts
const ROLE_ROUTES: Record<string, string[]> = {
  owner: ['/dashboard'],
  teacher: ['/dashboard/daily', '/dashboard/calendar'],
};
```

## Role home

`owner` → `/dashboard`, `teacher` → `/dashboard/daily`.

## Demo & dev bypass

Two distinct gates — don't conflate them:

- **Demo login** (`src/features/auth/demo-login.ts`): gated on `NEXT_PUBLIC_DEMO_MODE === '1'`. ⚠️ This var is **not registered in `env.mjs`** (bug candidate — see violations.md).
- **Dev-session route** (`src/app/api/auth/dev-session/route.ts`): blocked only when `VERCEL_ENV === 'production'` + `DEV_AUTH_BYPASS` — i.e. it can run on CI/preview, not just local dev.

## Auth client

`src/lib/auth-client.ts` — Better Auth client for the browser.

## Database schema

Better Auth tables in `src/db/schema/auth.ts`: `user`, `session`, `account`, `verification`. `role` enum on user: `owner | teacher`. Better Auth tables skip the audit triplet (`deletedAt` etc.).

## On API error

Better Auth config routes errors to `/login?error=access_denied`.

## PII handling

`src/lib/pii.ts` — detection and masking utilities for PII fields (names, emails, phones, addresses, DOBs, national IDs). **Infrastructure-only today — zero call sites.** Intended for log boundaries once wired up (see violations.md).
