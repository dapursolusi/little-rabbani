# Project Working Memory

Last updated: 2026-11-10 (full implementation audit)

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
- **MVP:** In progress (branch `feat/monthly-report`, 46 commits ahead of `main`, no PR yet).
- **Built:** Generation (single + batch), editor, preview, save/review/send/undo lifecycle, regeneration guards, class overview, kid page single-read. 14 test files — best-covered area in repo.
- **Remaining:** Finish client decomposition WIP, commit/PR, human smoke test.
- **Deferred:** Persistence edge cases, rate limiting (see NEXT).
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
- **Test coverage uneven:** 31 unit/integration files; zero for class-session, kid-enrollment, theme; 1 e2e spec (placeholder homepage).
- **`console.error` in server services** violating logger rule: kid ×4, kid-enrollment ×3, term, class-session.
- **`src/lib/action/` is singular** — AGENTS.md documents `src/lib/actions/`.

---

## 2. Current Priorities

### NOW — Monthly Report MVP

**Why are we doing this?**

Complete the monthly reporting workflow so teachers can generate, edit, review, and send monthly reports to guardians.

**Current status:**
- Monthly report generation implemented (single + batch).
- Editor and preview implemented.
- Save, review, send, and undo workflows implemented.
- Class overview implemented; kid page now does a single read.

**Current task (uncommitted WIP):**
- Extract `MonthPicker` (done → `kid/components/month-picker.tsx`, 64 lines).
- Extract `ConfirmationDialog` (done → `src/components/confirmation-dialog.tsx`, 49 lines).
- Client diff: +32 / −134 in `src/features/report/kid/components/client.tsx` (647 lines left).
- `.gitignore`: dropped `/temp*` (working memory now tracked).
- `temp/` untracked.

**Decisions:**
- Remaining planned extractions (`KidObservationSummary`, workflow hook, report panel) were not done — only the two above landed. Reassess before continuing; client is still 647 lines.
- Keep tightly coupled implementations together.
- No unrelated architectural cleanup.

**Refactor implemented (2026-11-10, approved):**
- `kid/components/client.tsx` 647 → 215 lines: header, term selector, month picker, observation summary, final-month branch, panel composition.
- `kid/components/report-panel.tsx` (new, ~409 lines): lifecycle state, generate/save/review/send/undo handlers, tabs, workflow buttons, 3 confirmations.
- `kid/components/narrative-preview.tsx` (new, ~61 lines): pure renderer.
- Verified: typecheck clean; `tests/unit/features/report` + `tests/unit/app/report` 195/195 pass; prettier clean. ESLint: 2 pre-existing-style warnings on stateful component (complexity/max-statements), no errors.
- Not covered by automated tests: none new — behavior unchanged, tests render through `KidReportClient`.

**Next action:**
Run `bun run check`, human smoke test the kid report page (generate → edit → undo → review → send), then commit the WIP: month picker + confirmation dialog extraction + client decomposition.

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

