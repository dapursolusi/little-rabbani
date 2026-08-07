# Role-Segmented Dashboard Routes → Flat /dashboard + RBAC

Rejected `dashboard/owner/*`, `dashboard/teacher/*`, `dashboard/parent/*` route segmentation in favor of flat `dashboard/<feature>` with role capability enforcement at the proxy.

## Why

Owner/teacher(/future parent) share the same domain — kids, sessions, reports, calendar. Role-in-URL forces per-role duplicates of any cross-role feature (daily class report is owned by owner _and_ teacher). Next.js forbids two route groups resolving to the same URL, so the _only_ way to get per-role layouts via routes is the role segment — 3 sidebars/tab bars to keep in sync. Industry practice (Stripe/Notion/Linear): feature URLs, capability filtered inside. Tokopedia's buyer/seller split is a _different surface_, shipped as separate apps — the trigger is zero feature overlap, not role.

## Decision

1. **Flat routes:** `owner/*` → `dashboard/*` (settings loses "Owner" in metadata title). Old `/dashboard/owner/*` URLs dropped — no redirects (bookmarks/caches 404).
2. **Shared shell:** `dashboard/layout.tsx` absorbs `owner/layout.tsx` (AppSidebar + header + breadcrumb). Nav items gain a `roles` field; sidebar filters by session role. `teacher-tabs.tsx` deleted — dead `/dashboard/teacher` routes, superseded by shared shell.
3. **Proxy gate (read-path):** `proxy.ts` capability map `ROLE_ROUTES` replaces URL-split rules. Owner → all; teacher → `/dashboard`, `/dashboard/daily`, `/dashboard/calendar`; parent (future) → `/dashboard`, `/dashboard/daily`. Authed+allowed → pass; authed+denied → 403; bare `/dashboard` → redirect by role; unauthenticated → login unchanged. **Critical:** no page self-guards — proxy is the _only_ read-path auth; `requireOwner` in server actions stays as write-path guard.
4. **Login:** role-based `redirect()` → single `redirect('/dashboard')`; proxy's bare-route rule dispatches by role.
5. **`?teacher-preview=true`** dev/testing flag: proxy resolves role as teacher to verify 403 + nav gating without a seeded teacher user. Not a shipped feature.

## Verification

`bun typecheck` + `bun lint`; grep `dashboard/owner|dashboard/teacher` → zero non-archive hits; `find src/app/dashboard` confirms flat tree. Smoke via `?teacher-preview=true`.

## Tradeoffs

Proxy capability map and sidebar `roles` are two mirrors of the same truth (client sidebar can't auth; proxy is authority) — drift is the risk, kept adjacent and documented. Page-level guards (standard RBAC shape) rejected: redundant once enforcement is centralized. One authority, smallest diff, no security regression. Teacher read-access _was_ blocked by proxy URL rules; those rules are replaced, not deleted — removing them entirely would leak owner-only reads.
