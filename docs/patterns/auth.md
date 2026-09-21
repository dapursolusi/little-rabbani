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

## Auth gate — `requireOwner()`

Single auth gate for all mutations. Wraps any handler:

```ts
return requireOwner(async () => {
  // ...action body...
});
```

Redirects to `/login` if unauthenticated. Returns `{ success: false, error: 'Akses ditolak...' }` if role is not `owner`. Located at `src/lib/actions/require-owner.ts`.

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

## Demo mode

`src/features/auth/demo-login.ts` — dev-session bypass for one-click owner login. Only in development.

## Auth client

`src/lib/auth-client.ts` — Better Auth client for the browser.

## Database schema

Better Auth tables in `src/db/schema/auth.ts`: `user`, `session`, `account`, `verification`. `role` enum on user: `owner | teacher`.

## On API error

Better Auth config routes errors to `/login?error=access_denied`.

## PII handling

`src/lib/pii.ts` — detection and masking utilities for PII fields (names, emails, phones, addresses, DOBs, national IDs). Used at log boundaries, not in every action.
