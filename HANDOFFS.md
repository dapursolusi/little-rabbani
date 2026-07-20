# HANDOFFS.md

## [Session — 2026-07-18] — Migrate term entity to feature-based pattern

- **What changed:**
  - `src/features/term/{actions,schema,fields,types}.ts` — feature co-location for term entity
  - `src/features/term/components/columns.tsx` — `termColumns` with extended row actions (Aktifkan, Kelola Murid, Lihat Sesi + RowActionsDialog edit/delete)
  - `src/features/session/{actions,schema}.ts` — extract session CRUD from the mixed legacy file (full drain)
  - `src/components/sections/term-form-wrapper.tsx` — `TermFormWrapper` using `DefaultFormFields` (kid/guardian pattern)
  - `src/components/form/schema-registry.ts` — registered `'term'` schema key
  - `src/components/shared/table/{data-table-row-action,row-actions-dialog}.tsx` — added optional `extendedActions` render-prop slot between Edit and Hapus
  - Migrated term list page → `<DataTable>` with `form` prop (inline add-modal + termColumns)
  - Migrated term create/edit pages → use `TermFormWrapper` (DefaultFormFields engine)
  - Updated all 19 importers of `@/lib/actions/term` → new feature paths
  - Deleted `src/lib/actions/term.ts` (drained)
- **State:** shipped on `refactor/crud`
- **Verification:**
  - typecheck PASS (0 errors)
  - 339 tests PASS (0 failures)
  - lint: 0 errors, 90 pre-existing warnings
- **Next steps:**
  1. Open PR from `refactor/crud` → main, merge after CI
  2. Continue pattern migration for session, activity, schedule, reports entities (per patterns.md)
  3. The `src/components/sections/term-form.tsx` and `term-actions.tsx` legacy section files are still on disk but no longer imported by any page (they've been superseded). Clean up after verifying nothing links to them.
  4. Delete the empty `src/features/term/hooks.ts`
- **Blockers:** none
