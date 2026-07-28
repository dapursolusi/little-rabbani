# Spec: Curriculum & Daily-Capture Integration

## Problem

Daily capture has no plan source. The DCR form hardcodes `initialActivities={[]}` (`src/app/dashboard/owner/daily/capture/[sessionId]/page.tsx:68`) even though `getCalendarEventsForDcr` already fetches today's planned items — the result is used only for an empty-warning, never to populate the form. The owner types every activity by hand. `dcrActivity.wasPlanned` has no real link to anything.

Meanwhile "calendarEvent" is carrying two unrelated jobs: the **day-to-day pedagogy backbone** (batch-planned, week→semester) and the **rare ad-hoc event** (an outing, a permission slip). Calling both "events" defeats the term — authoring the weekly plan one-by-one as "events" is the wrong unit.

## Scope

**IN:** A `curriculum` table — undated, shared, ordered, per-term — holding the planned pedagogy core (objective, indoor, items-to-bring) authored as a batch for a term. A `curriculumId` FK on `dailyClassReport` so each captured session-day locks the curriculum item it was on. A `getNextCurriculumForSession(sessionTypeId)` read that derives "next" from capture history (lowest sortOrder not yet locked by a DCR for that session). Rewriting the capture page so `initialActivities` is populated from curriculum (planned core) while `getCalendarEventsForDcr` stays loaded for the exception layer (outings/permission). Reordering `sortOrder` for un-consumed items.

**OUT:** Cross-term sequence reuse / blueprint projection engine (deferred — see ADR-0008). `learningDomain` enum / scope-and-sequence milestones. The curriculum authoring UX details (list-editor for a term's whole sequence) — implementation decision, not spec. Scale to multiple preschools / many classes (the condition that reopens blueprint+projection).

## Happy Path

1. Owner opens Curriculum, picks the active term, batch-authors an ordered list: item 1 … item N (each: sub-theme, name, objective, indoor, items-to-bring, sortOrder). Saves. Sequence is shared across all sessions.
2. Session A's capture day arrives. Owner opens capture for session A on date X. Page calls `getNextCurriculumForSession(A)` → returns item Z (sortOrder 21, "mung bean"). DCR form's `initialActivities` is pre-populated with Z as the planned core (`wasPlanned=true`).
3. calendarEvent for date X (the exception layer — an outing to the garden) is also loaded and surfaced alongside the planned core.
4. Owner marks the planned core done/skipped/modified, adds an unplanned "snack" (`wasPlanned=false`, no link), saves DCR → `curriculumId = Z` is locked on the DCR.
5. Session B captures on date X (same day, different clock) → `getNextCurriculumForSession(B)` also returns Z (B is at the same position). B locks Z too.
6. Session C, behind two weeks, captures on date Y → `getNextCurriculumForSession(C)` returns its own next (earlier in the sequence, not Z yet — C has consumed fewer items). C reaches Z on its own later date.
7. Owner reorders two un-consumed items (neither referenced by any DCR). Captured DCRs (locked by id) are untouched.

## Data Model

```sql
-- NEW: undated, shared, ordered, per-term
curriculum:
  id            uuid pk
  term_id       uuid FK→term     NOT NULL       -- per-term sequence
  sort_order    int              NOT NULL default 0  -- the "day 21" ordinal; reorderable
  sub_theme_id  uuid FK→sub_theme NOT NULL     -- theme area
  name          text             NOT NULL        -- activity label
  objective     text             nullable        -- the one pedagogical delta
  indoor        bool             default false
  items_to_bring text             nullable        -- lives here (also on calendar_event; ADR-0008 tradeoff)
  created_at, updated_at, deleted_at
  -- NO date column. NO session_type_id column. Shared across sessions.

-- EXISTING: gains one nullable FK
daily_class_report:
  ... existing (date, session_type_id, learning_notes, captured_by, ...) ...
  curriculum_id  uuid FK→curriculum  nullable     -- "the lock": which item this session-day was on
  unique(date, session_type_id)                   -- unchanged (ADR-0007)

-- UNCHANGED: dcrActivity, calendarEvent, holiday, observation
```

Session position is **derived, not stored**: for session X, next = lowest-`sortOrder` curriculum row whose `id` is NOT in `(SELECT curriculum_id FROM daily_class_report WHERE session_type_id = X AND curriculum_id IS NOT NULL)`.

## Edge Cases

- **Brand-new session, no captures** → `getNextCurriculumForSession` returns the lowest-`sortOrder` item (position 0). No pointer to initialize.
- **Session catches up / overtakes another** → fine; each session's "next" is independent, derived from its own DCR history.
- **All items consumed** → `getNextCurriculumForSession` returns null → capture page shows "curriculum sequence complete" empty state (distinct from "no curriculum authored").
- **No curriculum authored for the term** → returns null → capture page falls back to today's behavior (`initialActivities=[]`, owner types by hand). Migration-safe.
- **Owner reorders an item a session hasn't reached** → that session's "next" shifts. Acceptable (item un-consumed by that session). Guard: warn if the moved item is referenced by _any_ DCR (it shouldn't shift a captured lock, but signals the owner is changing forward plans).
- **Owner reorders an item already locked by a captured DCR** → no effect on that DCR (reads by id), but the guard fires louder. Allow but surface.
- **Owner edits a curriculum item's content (name/objective) after capture** → the captured DCR's display of "planned core" reflects the _current_ row content (reads by id at view time). Acceptable for v1; full point-in-time history is a later concern (same shape as catalog edits elsewhere).
- **Holiday on a capture day** → the session just doesn't capture that day; its "next" is unaffected (no DCR created, so the item stays un-consumed for that session). Aligns with ADR-0007's derived school-day model.
- **Two sessions share a date** → independent DCRs (different `sessionTypeId`), each locks its own "next" — A and B may lock the same item Z, that's correct.

## Acceptance Criteria

- [ ] `curriculum` table migrated with `term_id` NOT NULL, `sort_order`, `sub_theme_id`, `name`, `objective`, `indoor`, `items_to_bring`, audit columns.
- [ ] `daily_class_report.curriculum_id` nullable FK migrated; relation `with: { curriculum }` resolves without 500.
- [ ] `getNextCurriculumForSession(sessionTypeId)` returns the correct next item by derived position; unit-tested for fresh / mid-sequence / complete / empty cases.
- [ ] Capture page populates `initialActivities` from `getNextCurriculumForSession` (planned core, `wasPlanned=true`); falls back to `[]` when no curriculum exists.
- [ ] Capture page still loads `getCalendarEventsForDcr` for the exception layer (outings/permission) without regression.
- [ ] Saving a DCR locks `curriculumId` on the row.
- [ ] Reordering un-consumed `sortOrder` does not change any captured DCR's resolved planned core (verified by id-read).
- [ ] `bun typecheck` + `bun lint` + `bun build` pass.
- [ ] No console errors.

## Technical Notes

Depends on: 001-scaffold-auth, 002-master-data, 003-capture-flow (partially superseded — see below), ADR-0007 (calendar-date-anchor), ADR-0008 (this feature's decision record).

DB migration on the confirmation gate (AGENTS.md): `bun run db:generate` → `bun run db:migrate`, then verify the `with: { curriculum }` relation resolves against the live DB.

`getNextCurriculumForSession` belongs in `src/lib/actions/dcr.ts` (alongside `getCalendarEventsForDcr`) for the initial slice, migrating to `src/features/curriculum/actions.ts` per the `features/<entity>/` pattern once the module has more than one action. Feature module shape mirrors sibling entities (`src/features/curriculum/{schema,types,fields,actions}.ts`).

**Note on spec-003:** the capture-flow spec predates ADR-0007 and still references the old `schedule_items` / `session_id` (FK sessions) / `unique(session_id)` model that ADR-0007 replaced with date-anchored `unique(date, sessionTypeId)`. Spec-003's _flow_ (Pass 1 / Pass 2 / offline queue / conflict UI) remains accurate; its _data model lines_ are stale. This spec does not re-litigate capture flow — only the plan→capture handoff that 003 left as "prefilled from schedule" without a concrete source.

**Smallest spine to ship first** (per ADR-0008): `curriculum` table + `dailyClassReport.curriculumId` FK + `getNextCurriculumForSession` + wire `initialActivities` in the capture page. The curriculum _authoring_ form is the iteration after.
