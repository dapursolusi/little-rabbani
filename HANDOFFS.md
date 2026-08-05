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
