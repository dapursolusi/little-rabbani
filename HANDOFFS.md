## [Session — 2026-07-28] — Curriculum module design (docs only, no code)

- **What changed:**
  - `docs/adr/0008-curriculum-shared-undated-sequence.md` — ADR: curriculum as shared/undated/ordered/per-term sequence; DCR gains `curriculumId` FK; no projection engine (DCR is the dated instance)
  - `docs/specs/008-curriculum-and-capture-integration.md` — spec: plan→capture handoff, `getNextCurriculumForSession`, capture page rewrite
  - `CONTEXT.md` — glossary entry for Curriculum (distinct from Calendar Event)
- **State:** Docs shipped. No schema/code touched.
- **Verification:** None (docs-only).
- **Next steps:**
  1. `curriculum` table migration: `bun run db:generate` → `db:migrate` (confirmation gate)
  2. `dailyClassReport.curriculumId` nullable FK
  3. `getNextCurriculumForSession(sessionTypeId)` in `src/lib/actions/dcr.ts` → later `src/features/curriculum/actions.ts`
  4. Wire capture page `initialActivities` from curriculum; keep `getCalendarEventsForDcr` for exception layer
  5. Curriculum authoring form (the iteration after the spine)
- **Blockers:** None. Migration is on confirmation gate — awaiting explicit go.

D-008: Curriculum = undated shared sequence, DCR = dated instance, no projection — dated-instance/blueprint alternatives rejected; blueprint deferred until multi-school scale.

## [Session — 2026-08-06] — Fix: curriculum filled for Aug 6/7 showed on Jul 1/2

- **What changed:**
  - `src/features/curriculum/actions.ts` — `createCurriculumItems` accepts optional `date`; resolves `sortOrder` = index of the date in the term's workday list (rejects non-workdays, rejects duplicate dates per day). Date-less inputs still append at MAX+1.
  - `src/app/dashboard/owner/curriculum/page.tsx` — computes next empty workdays of active term server-side (`listTermWorkdays` + filled-sortOrder projection), passes first as `date` to single-add form; passes list to BatchModal.
  - `src/features/curriculum/components/batch-modal.tsx` — takes `nextEmptyDates`, each row lands on `nextEmptyDates[i]`.
  - `tests/features/curriculum/create-curriculum-items.test.ts` — new: date→sortOrder resolution, non-workday rejection, duplicate-date rejection, date-less append fallback (4 tests).
  - `drizzle/0029_drop_curriculum_schedule_date.sql` + journal entry — drops the dead `schedule_date` column (applied to live DB).
  - Live rows repaired: sort 0/1 → 24/25 (Aug 6/7).
- **State:** Shipped (PR #73).
- **Verification:** `bun run test:run -- tests/features/curriculum/` (23 pass), `bun run typecheck` clean, eslint/prettier clean on touched files. Live projection script confirmed sort 24/25 → Aug 6/7, Jul 1/2 empty.
- **Next steps:** None.
- **Blockers:** None.

D-009: Curriculum stays undated — dates derive from `sortOrder` projected onto the term's active workdays; write paths must resolve sortOrder from a target date (or next empty workday), never MAX+1 append. Root cause of #72.
