# Project Working Memory

Last updated: 2026-11-10 (monthly report MVP shipped, PR #102)

## 1. Project Status

### LMS

#### 1. Kid

- **MVP:** CRUD page implemented.
- **Built:** List (search/limit/count), create (new guardian OR existing guardian), edit (dual guardian modes), hard delete, guardian search, table + row actions.
- **Deferred:** Kid media management, detail page, bulk ops, soft delete (schema has `deletedAt` but `remove()` is hard delete), restore, activeStatus filter on list.
- **Won't Have:** Kid portal.

#### 2. Guardian

- **MVP:** No standalone module — lives inside `kid` (1 guardian : N kids via FK, ADR-0002).
- **Built:** `resolveGuardian` upsert in tx, phone/email collision checks (live-only partial unique indexes), search by name/phone, shown in kid list + `GuardianPicker`.
- **Deferred:** Guardian portal, standalone guardian pages (list/create/edit/delete), multi-guardian per kid.
- **Won't Have:** Guardian media management.

#### 3. Daily Class Report

- **MVP:** Implemented (largest vertical: 23 files, ~2650 LOC).
- **Built:** 4-layer vertical; per-kid observations (attendance/mood/appetite/notes); template narrative with `{{placeholder}}`/`{{#if}}` rendering; `draft/edited/sent` status; 7-day edit lock (`EDIT_WINDOW_DAYS`); send + copy-to-clipboard; history calendar.
- **Deferred:** Dedicated `/dashboard/report/daily` route (nav link 404s), backfill/edit past-day UI, `draft` status persistence (currently client overlay only).
- **Won't Have:** [Explicit exclusions]

#### 4. Monthly Report

- **MVP:** Shipped to `main` (PR #102, squash `7b22295`).
- **Built:** Generation (single + batch), editor, preview, save/review/send/undo lifecycle, regeneration guards, class overview, kid page single-read, enrollment-aware month picker, kid client split into `client.tsx` / `report-panel.tsx` / `narrative-preview.tsx`. 15 test files — best-covered area in repo.
- **Deferred:** Human smoke test (generate → edit → undo → review → send) still pending; persistence edge cases, rate limiting (see NEXT).
- **Won't Have:** [Explicit exclusions]

#### 5. Term

- **Built:** CRUD, overlap check, auto-create current term + chained next term (no gaps), `OngoingTermProvider`/`TermSelector`, 20 tests.
- **Deferred:** School-year/sequence columns (name parsed at create time only).
- **Won't Have:** [Explicit exclusions]

#### 6. Class Session

- **Built:** CRUD, overlap validation, last-session-delete guard, owner gating.
- **Deferred:** Tests (zero), teacher assignment.
- **Won't Have:** [Explicit exclusions]

#### 7. Teacher

- **MVP:** Role only — `roleEnum` owner|teacher + proxy route gate + dev preview bypass.
- **Built:** Role enum, proxy read-gate, demo session.
- **Deferred:** Teacher module, teacher routes, class-assignment model (no user↔classSession FK), teacher-scoped data filtering, `TeacherTabs` (zero call sites, links to nonexistent routes).
- **Won't Have:** [Explicit exclusions]

### Cross-cutting gaps (audited 2026-11-10)

- **5 dead nav links** (all 404, verified): `/dashboard/activity`, `/dashboard/curriculum`, `/dashboard/calendar`, `/dashboard/report/daily`, `/dashboard/report/quarterly`.
- **Dashboard page is a stub** (`<div>Dashboard</div>`); 5 pages missing `metadata` (dashboard, term, daily, class-session, registration).
- **Auth gating in 4 places, no single policy:** proxy route gate (`src/proxy.ts:81`), `requireOwner` inside services, action-level inline (`report/kid/actions.ts:34`), page-level inline (settings pages).
- **Duplicate confirmation components:** `src/components/confirmation-dialog.tsx` (new, kid client only) vs `src/components/sections/confirm-dialog.tsx:25` (older, month client).
- **Test coverage uneven:** 32 unit/integration files; zero for class-session, kid-enrollment services, theme; 1 e2e spec (placeholder homepage).
- **`console.error` in server services** violating logger rule: kid ×4, kid-enrollment ×3, term, class-session.
- **`src/lib/action/` is singular** — AGENTS.md documents `src/lib/actions/`.
- **`[id]` route params are not UUID-validated** on any dynamic route; a non-uuid reaches Postgres and 500s on the uuid compare.

---

## 2. Current Priorities

### NOW — Next slice (monthly report shipped)

**Why are we doing this?**

Monthly reports are live. Close the remaining quality gaps before starting the next feature.

**Next action:**

1. Human smoke test the kid report page: generate → edit → undo → review → send.
2. Decide whether to validate `[id]` route params as UUIDs project-wide (currently unvalidated on every `[id]` route; a non-uuid 500s at the Postgres uuid compare).
3. Pick the next slice: monthly report persistence edge cases / rate limiting, or hide the 5 dead nav links.

### NEXT

1. Monthly report persistence edge cases.
2. Monthly report rate limiting.
3. Dead nav links — hide or build (5 entries).
4. Duplicate confirmation dialog components — unify.
5. Missing `metadata` on 5 pages; `console.error` → logger in services.
6. Termly/quarterly report MVP.

### LATER

- Other deferred LMS capabilities.
- Additional improvements not required for current MVP.

---

## 3. Active Decisions & Constraints

- Maintain existing feature folder conventions.
- Client composition root: `components/client.tsx`.
- Prefer responsibility-based extraction over line-count-based extraction.
- Every completed feature slice requires automated verification, evidence-based review, and human smoke testing.
- Guardian lives inside `kid` vertical — no standalone guardian module (ADR-0002 identity-only kid, 1 guardian : N kids).
- Daily report editable only within 7 days (`EDIT_WINDOW_DAYS`); monthly reports immutable once sent.
- `docs/patterns/violations.md` is accurate — check it before touching term/class-session/kid services.
