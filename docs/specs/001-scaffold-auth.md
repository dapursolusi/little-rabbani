# Spec: Scaffold & Auth

## Problem

No application infrastructure exists. No database, no auth, no shell — nothing to build features into.

## Scope

**IN:** Next.js + TypeScript + Tailwind init, Neon Postgres + Drizzle ORM, Google OAuth (Owner + Teacher roles only), role-aware dashboard redirect, empty dashboard shells (Owner / Teacher), session management.

**OUT:** Any CRUD, any feature UI, any data models beyond user/session, WhatsApp API, email auth, multi-tenant.

## Happy Path

1. User visits app → prompted for Google OAuth login.
2. System verifies email against allowed users table, detects role (Owner / Teacher).
3. Owner → redirected to `/dashboard/owner` with empty-state shell.
4. Teacher → redirected to `/dashboard/teacher` with empty-state shell.
5. Expired session → redirected to login.

## Data Model

```sql
users: id, email, name, role (enum: owner|teacher), avatar_url, created_at, updated_at
sessions: id, user_id (FK users), expires_at, created_at
```

Role assignment is manual (no self-registration). One Owner record seeded.

## Edge Cases

- Unregistered Google account → access denied with message ("Contact Owner for access").
- Owner record missing from DB → no one can log in.
- OAuth provider down → show retry prompt.
- Session expires mid-use → redirect to login, preserve intended destination.
- Teacher tries to access Owner route → 403 page.
- Browser blocks third-party cookies → OAuth flow fails → show manual-instruction fallback.

## Acceptance Criteria

- [ ] Google OAuth login works for Owner and Teacher roles.
- [ ] Unregistered email receives access-denied message.
- [ ] Owner dashboard loads at `/dashboard/owner`.
- [ ] Teacher dashboard loads at `/dashboard/teacher`.
- [ ] Teacher accessing Owner route returns 403.
- [ ] Expired session redirects to login.
- [ ] No console errors on login flow.
- [ ] Deployed to staging, working end-to-end.

## Technical Notes

Depends on: none. This is the first spec to implement — all others build on it.

Drizzle for ORM (not Prisma) — lighter, no codegen step. Middleware protects `/dashboard/*` routes by role. Auth via BetterAuth with Google provider.
