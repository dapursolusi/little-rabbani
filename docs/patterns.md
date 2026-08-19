# Patterns — living extraction of the implemented code

Follow these for new and refactored code. **Code wins if this doc disagrees —
update this doc in the same change.** Extract a new pattern only after a
repeatable shape lands; promote to AGENTS.md only after 3+ entities use it
unchanged. Split into per-stack files when it grows too large.

Only the **kid** vertical is implemented; these patterns come from it.

## Server Actions

- **Discriminated-union result** — every action returns `{ success: true,
  data } | { success: false, error }` (`as const`). Clients narrow with
  `if (!result.success)`. Type alias `ActionResult<T>` lives in
  `src/lib/actions/require-owner.ts`.
- **`requireOwner()`** — the single auth gate. Wrap the action body:
  `return requireOwner(async () => { ... })`. Redirects to `/login` when
  unauthenticated; returns `{ success: false, error }` when the session role
  isn't `owner`.
- **`parseInput(schema, unknown, fallback)`** — parse at every I/O boundary.
  Returns an ActionResult directly from a failed zod parse, so a failed parse
  is returned from the action with no branching.
- **`db.transaction`** — cross-table writes are atomic. `createKid`/`updateKid`
  insert/update guardian + kid in one transaction. Requires the WS `Pool`
  driver (`src/db/index.ts`), not the http driver.

## Data / schema

- **`src/db/schema/`** — one file per entity (`kids.ts`, `auth.ts`), exported
  from `src/db/schema/index.ts`. Relations (`relations(...)`) declared beside
  the tables.
- **Soft delete** — destructive actions set `deletedAt` (`timestamp`) instead
  of deleting rows; reads filter `isNull(deletedAt)`.
- **Index every FK** — see AGENTS.md "Settled hard rules". Example:
  `kid_guardian_idx` on `kid.guardianId`.
- **Enum + label consts** — a `pgEnum` (or `as const` array) plus a parallel
  `*_LABELS` record mapping value → Indonesian display label, exported from
  the schema file and reused by both the form (select options) and the table
  (cell renderers). Example: `GENDER_LABELS`, `GUARDIAN_RELATIONSHIP_LABELS`.

## Forms

- **Entity schema → `FormField[]` → shared renderer.** `schemas.ts` holds zod
  schemas (create/update/base split, `KidGuardianFormSchema` for the combined
  form). `form-fields.ts` returns the field list (with `groupLabel` headers).
  `*-form.tsx` is a thin `use client` wrapper passing `schema`, `initialData`,
  `formFields` to `FormFieldGenerator`, mapping `onSubmit` to the actions and
  `onSuccess` to a route push.
- **Optional fields + nullable columns** — untouched RHF fields arrive as
  `undefined`; zod `min(1)` rejects them. Allow nullable+optional and coerce
  `''` → `null` on write (`nickName`, `secondContact*`).

## Tables

- **`DataTable`** (v9, `src/components/shared/table/`) — shared table with
  search, filters, pagination, column visibility, mobile view. Column defs are
  `ColumnDef<AppTableFeatures, T>`; per-column search/filter config lives in
  `meta` (`{ title, enableSearch, filter }`). Row actions via
  `RowActionsDialog` (edit link + delete action).
- **React Compiler gotcha** — do not read live values off the stable `table`
  instance in render; mirror pagination state into `useState` and derive UI
  from that (AGENTS.md gotcha).

## Shared UI

- `src/components/shared/` for cross-feature components (`EmptyState`,
  `Pagination`, `SearchInput`, `getStatusBadge`, `DataTable`, form engine).
- Never edit `src/components/ui/` (shadcn base-nova, auto-generated).
