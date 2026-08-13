# Code Patterns — Living Reference

> **Status: DRAFT.** Describes the `features/`-based rewrite target, not a rule. Settled decisions (schema-registry cast, `ui/` auto-gen, action-result shape) live in `AGENTS.md`.
>
> ## Why this exists
>
> Two orgs coexist: legacy `src/lib/actions/` (flat, domain-dump) → target `src/features/<entity>/` (co-located CRUD engine). This doc ensures new domains land in the target shape. Locks **direction** (feature-based, template = `kid`/`guardian`), not engine internals.

## 1. Feature-based co-location

Entity code lives together under `src/features/<entity>/`. **`kid` and
`guardian` are the reference templates** — model new entities on them, not on
the `lib/actions/<domain>.ts` legacy files.

```
src/features/<entity>/
  actions.ts        # 'use server' — all server actions for this entity
  fields.ts         # export const <entity>Fields(params): FormField[]
  schema.ts         # Zod form schema + inferred type
  types.ts          # domain types (extends BaseDataResponse where it's a table row)
  components/
    columns.tsx     # TanStack ColumnDef[] for the DataTable
  constants.ts      # (kid only, optional) e.g. STATUS_TRANSITIONS
```

### Server actions (`actions.ts`)

- File starts with `'use server';`.
- **Narrow-files-when-fat rule (declared intent, not yet exercised):** if an
  `actions.ts` exceeds ~200–300 lines, split into a folder —
  `features/<entity>/actions/{fetch.ts, write.ts, index.ts}` — with `index.ts`
  as the export aggregator so callers still import from
  `@/features/<entity>/actions` (barrel becomes a folder). No entity needs this
  yet (`kid` ~230 lines is near the threshold).
- **Auth gate first, always:** every action opens with `await requireOwner()`
  and returns `{ success: false, error }` on unauthorized — never throws.
- **`params`-object args for reads:** `getKids({ search?, limit?, offset? })`,
  not positional. Lets pagination/search grow without breaking callers.
- **CRUD naming:** `get<Entity>(id)`, `get<Entity>s(params)` (plural = list),
  `create<Entity>(input)`, `update<Entity>(id, input)`, `delete<Entity>(id)`.
  Soft-delete = `UPDATE … SET deletedAt = now()` (the `deleted_at` column is
  on every business table; hard deletes are avoided).
- **Reader/detail shapes differ by purpose and that's fine:**
  - List (`getKids`) returns `{ success, data, total }` with relations
    `with: { guardian: true, enrolledTerm: true }` so columns render flat.
  - Detail (`getKid`) returns `{ success, data }` with the same relations.
  - `getActiveTerm()` is a plain `Term | null` return (no envelope) — used
    intra-action for enrollment validation, not surfaced to the client. The
    shape tracks the caller: envelope for client-bound returns, bare for
    internal helpers.
- **Tenancy-aware conditions:** list queries append `isNull(<entity>.deletedAt)`
  so soft-deleted rows never surface. Composed via `and(...conditions)` and
  falls through to `undefined` when empty (Drizzle treats that as no filter).
- **Domain invariants live with the action, not the schema:** `updateKid`
  enforces the `waiting → enrolled → alumni` state machine
  (`STATUS_TRANSITIONS` across `actions.ts` + `constants.ts`) _after_
  `safeParse`, because the transition depends on persisted state the form
  can't know. The inline comment explains the ordering.
- **`onSuccess` for client-drive actions, return value for client-driven ones:**
  all actions return the discriminated union; the client decides whether to
  `router.refresh()`. Services yet to be factored out may change this.

### Result envelope (discriminated union)

Every client-facing action returns `{ success: true, data } | { success: false,
error }` with `as const` on the `success` literal so callers narrow via
`if (!result.success)`. `error` is always a user-facing Bahasa Indonesia
string (e.g. `'Gagal membuat murid'`), never a raw DB message. `BaseDataResponse`
(`src/types/index.ts`) carries `id/createdAt/updatedAt/deletedAt?` for table rows.

### Zustand: no stores in this pattern yet.

## 2. Schema registry + generic form engine

> **In flux.** This is the high-abstraction surface. The shared `DefaultFormFields`
> owns submit/toast/refresh and the field renderer switches on config — but only
> `kid` and `guardian` participate. Don't assume the registry survives
> unchanged; `AGENTS.md` already flags "option 2" (per-entity forms) if
> compile-time schema matching matters. Refine this section as more entities
> migrate.

### Zod schema per entity (`schema.ts`)

```ts
const KidFormSchema = z.object({/* field rules + Bahasa messages */});
export { KidFormSchema };
export type KidFormData = z.infer<typeof KidFormSchema>;
```

### Registry (`src/components/shared/form/schema-registry.ts`)

```ts
const schemas = { kid: KidFormSchema, guardian: GuardianFormSchema }
  as const satisfies Record<string, z.ZodObject<z.ZodRawShape>>;
export type SchemaKey = keyof typeof schemas;
export function getZodSchema<K extends SchemaKey>(key: K) { … }
```

Adding an entity = (1) write `schema.ts`, (2) register key in the record, (3)
add `fields.ts` returning `FormField[]`, (4) add `columns.tsx`. No changes to
the form component itself.

### Field configuration drives inputs (`types/field.ts` + `fields.ts`)

- `FormField` is a discriminated union on `type`: `CustomHTMLInputTypeBasic`
  (native input types, `selectOptions?: never`) or `CustomHTMLInputTypeSelect`
  (a `<Select>`, `selectOptions` required).
- `StrictHTMLInputType` mirrors React's `HTMLInputTypeAttribute` deliberately
  (comment notes it), NOT as `any` — a new input type mirrors it here.
- `kidFields({ guardians, enrolledTerms })` returns `FormField[]` with
  **options computed at call time** from fetched relations — the field list is
  built server-side in the page and passed in, never imported as a module
  singleton when options depend on data.

### The generic form component (`DefaultFormFields`)

Single component renders any entity's create/update form. Props:

```ts
{
  schemaKey?: SchemaKey;           // undefined → resolves to z.object({}) (no validation)
  initialData: Record<string, unknown>;
  formFields: FormField[];
  onSubmit?: (data) => unknown | Promise<unknown>;
  children?: RenderProp | ReactNode;  // function form gets { isSubmitting }
  meta?: { label; domain? };
  onSuccess?: () => void;
}
```

Behaviour:

- `useForm` + `zodResolver(schema as never)` — the `as never` cast at the
  zodResolver↔react-hook-form library seam is the ONE accepted cast (zod v4's
  `$ZodType` variance makes generic passthrough unworkable across 3 library
  seams). Documented with a `ponytail:`-style comment naming the tradeoff

> (1 cast in a shared component vs per-entity forms).

- `mode: 'onChange'` for live validation.
- Maps `formFields` → `<Controller>` + `<Field>` (shadcn `field.tsx`) →
  `InputFieldRenderer` switches on `type` (select vs default native input).
- **Submit/toast/refresh is owned here, not in callers:** if `onSubmit`
  returns a `{ success; error? }`, it auto-toasts success/error and calls
  `router.refresh()` + `onSuccess?()`. Callers never duplicate the toast.

### DataTable owns add + row-edit modals (`data-table.tsx`)

The list page passes a single `form` prop (shape = `CreateUpdateFormProps`):

```tsx
<DataTable
  columns={kidColumns}
  data={kids}
  meta={{ label: 'Murid' }}
  form={{
    schemaKey: 'kid',
    initialData: {/* blank template */},
    formFields: kidFields({ guardians, enrolledTerms: terms }),
    onSubmit: createKid,
  }}
/>
```

`DataTable` wraps the tree in `<EditFormContext.Provider
value={{ schemaKey, formFields }}>` and uses it twice: (1) the add-modal's
`DefaultFormFields`, and (2) `RowActionsDialog` (rendered inside a column's
cell) reuses the same `DefaultFormFields` for row-edit. **One engine, one
config object, both create and edit** — the per-page code drops to columns +
blank-template + data fetch.

> **Migration debt visible in the engine:** `RowActionsDialog`
> (`updateAction`/`deleteAction` as props) is the bridge used by `kid`/`guardian`;
> `DataTableRowActions` (config-driven `toastMessage`/`dialogMessage`/`actions`)
> is the newer generic row-action. The legacy `sections/*-actions.tsx` files
> pre-date this. Expected to consolidate as each domain migrates.

## 3. Pages (App Router)

- **Server Components by default.** Only the leaf client islands carry
  `'use client'`.
- **`params`/`searchParams` are Promises** (Next 15 async dynamic APIs):
  `const { id } = await params;
const { search, page } = await searchParams;`.
- **Parallel fetch:** `Promise.all([getKid(id), getGuardians(), getTerms()])
  — never sequential awaits when independent.
- **Lenient fan-out reads:** when a sub-result is optional for the page, narrow
  via `guardiansResult.success ? guardiansResult.data : []` so a failed fetch
  doesn't kill the whole page; the critical one (`kidResult`) gates `notFound()`.
- **`metadata` is always exported** and spread from `baseMetadata`:
  `export const metadata = { ...baseMetadata, title: 'Murid' };`.
- **List-card layout** is `overflow-x-auto rounded-lg` wrapping `<DataTable>`;
  edit forms live in `mx-auto max-w-lg rounded-lg border bg-card p-6`. List
  pages use a `<div>` card, edit pages sometimes use shadcn `<Card>`/`<CardContent>`
  — the inconsistency is pre-existing, not part of the target pattern.

## 4. shadcn usage (beyond the component name)

These are the patterns that make shadcn usage feel "native" rather than
name-matched:

### `render` prop composition — NOT `asChild`

base-ui primitives (the project's shadcn preset) use a `render` prop, NOT
Radix's `asChild`. Compose by passing an element to `render`:

```tsx
<DialogTrigger render={<Button variant="outline">Batal</Button>} />
<DropdownMenuTrigger
  render={<Button variant="ghost" size="icon-sm">…</Button>}
/>
<DialogClose render={<Button variant="outline">Batal</Button>} />
```

`trigger.render` can also be a function `(props) => ReactNode` for full control.
`asChild` does not exist in this preset — searching the codebase will show
fixes that removed it. **Do not introduce `asChild`.**

### `buttonVariants` for class-merging outside `<Button>`

When a non-Button element (a `<Link>`, a `DropdownMenuTrigger`, styled span)
needs Button styling, import `buttonVariants` and `cn(...)`:

```tsx
<Link href={…} className={cn(buttonVariants({ variant: 'default' }))}>
<DropdownMenuTrigger
  className={cn(
    buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
    'bg-transparent! hover:bg-muted!'
  )}
/>
```

This is how trigger-as-button is done without a wrapper `<Button>` and without
`asChild`.

### `data-*` state hooks + token classes

- State is communicated via `data-*` attributes consumed by classed
  selectors in `globals.css`, not inline conditional className. Example:
  `<Field data-invalid={fieldState.invalid}>` → `globals.css` styles
  `[data-invalid] { … }`.
- **Status/semantic colors are token classes, never raw Tailwind:**
  `bg-success/10 + text-success`, `bg-destructive/10 + text-destructive`,
  `bg-warning/10 + text-warning`, `bg-muted`, `text-muted-foreground`,
  `text-foreground`, `border`. Raw `bg-green-100`/`text-red-700`/`bg-zinc-*`
  are legacy. See `CONTEXT.md` C-2 mapping.
- **Icon buttons** use `size="icon-sm"` / `"icon"` variants with an `sr-only`
  label sibling for accessibility: `<span className="sr-only">Buka menu</span>`.

### Icons: Hugeicons, always

- Structural chrome uses `@hugeicons/core-free-icons` + `<HugeiconsIcon icon={…} />`
  from `@hugeicons/react`. Never emoji as chrome.
- Naming is descriptive (`Delete02Icon`, `Edit04Icon`, `More03Icon`,
  `ArrowLeft01Icon`, `Add02Icon`).
- Emoji is acceptable only as _data content_ (e.g. a recorded mood glyph),
  never as UI chrome.

## 5. Client-side mutation flow (unified toast/refresh)

The post-`ea4ad26` refactor collapses every mutation handler into one shape.
Before, `sections/*-actions.tsx` each had a bespoke `handleDelete`/
`handleActivate` with its own toast; now the engine owns it.

```tsx
async function submit() {
  const result = await onSubmitProp?.(data); // returns discriminated union
  if (result?.success) {
    toast.success(`${meta?.label ?? 'Data'} berhasil ditambahkan`);
    router.refresh();
    onSuccess?.(); // close modal, navigate, etc.
  } else {
    toast.error(result.error ?? 'Gagal menyimpan data');
  }
}
```

Rules:

- **Caller never toasts.** The engine toasts on success _and_ error.
- **Caller never catches.** The engine wraps in `try/catch` with a generic
  fallback toast and `if (result)` guards the unwrapping.
- **Caller never `router.refresh()`s** — the engine refreshes on success.
  Custom navigation (e.g. `router.push('/dashboard/owner/kid')` after create)
  goes in the `onSubmit` callback or via `onSuccess`.
- **`'use client'`** lives on the wrapper / engine, not the page. Pages stay RSC.

## 6. Component placement

| Component type              | Location                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Generic engine & primitives | `src/components/shared/`                                                           |
| shadcn base-nova components | `src/components/ui/` (auto-gen, **never** edit)                                    |
| Layout chrome (sidebar…)    | `src/components/layout/`                                                           |
| Page-level sections         | `src/components/sections/`                                                         |
| Entity UI (columns, forms)  | `src/features/<entity>/components/`                                                |
| Cross-entity wrappers       | `src/components/sections/` (`KidFormWrapper` bridges feature config → legacy page) |

### Sidebars

The old `OwnerSidebar` + `MobileNavSheet` were replaced by the shadcn
`AppSidebar` (`src/components/layout/app-sidebar.tsx`) + sidebar primitives
(`sidebar/` — `nav-user`, `team-switcher`, `breadcrumb`). Nav items are a
**discriminated union**: `LeafNavItem` (`href` + `subItems?: never`) or
`ParentNavItem` (`subItems` + `href?: never`) — the `? never` makes the two
variants mutually exclusive at the type level rather than enforced by runtime
checks.

## 7. Navigation wrappers

- **`Modal`** (`src/components/shared/modal.tsx`) is the generic dialog shell:
  it takes `trigger` (`{ href?, render?, text?, icon? }`) or a controlled
  `open`/`onOpenChange`, plus `content` and `footer` render-props. Use it for
  both add-modals and edit-modals. The add-modal in `DataTable` and the
  edit-modal in `RowActionsDialog` both compose `Modal` + `DefaultFormFields`.

## 8. Data table (TanStack under React Compiler)

`reactCompiler: true` memoizes reads through TanStack Table's stable `table`
handle, so getter-derived values (`getState().pagination`, `getIsSorted()`)
go stale in JSX while an imperative read in the render body stays fresh.
**Fix pattern (already applied here):** mirror table state into React
`useState` and derive UI values from the state, NOT from `table.getState()`:

- `state: { pagination, sorting, … }` + `on*Change: set*` on `useReactTable`.
- `SortingStateContext` and a derived `paginationInfo` object are read by JSX,
  not the getters. Mutations (`table.nextPage()`) still call the table.
- `table.getFilteredRowModel().rows.length` is safe because the rows array
  reference changes on filter update, triggering re-render.

Filters are **registry-driven**: `ColumnDef.meta.filter` either names a
registry filter (`{ type }`) or carries a custom `filterFn`. Global filter is
opt-in per column via `meta.enableSearch`, and the search placeholder is built
from the enabled columns' titles (`'Cari Nama atau Nama Wali …'`).

---

## What's NOT settled

- **Services layer** — none yet, actions talk to Drizzle directly. Extract pattern when backend refactor begins.
- **Logging** — no convention yet. `console.warn`/`console.error` only.
- **Middleware** — `requireOwner()` per-action is the only gate.
- **Engine final shape** — schemaKey registry vs per-entity forms, actions split into `fetch.ts`/`write.ts`, `RowActionsDialog` vs `DataTableRowActions` consolidation.
- **Legacy `sections/` wrappers** — not yet ported to generic engine.

## How to use

- New entity → copy `kid`/`guardian` template, add to registry
- Touching `lib/actions/term.ts`? → land in `features/term/`, drain legacy file
- Code contradicts this doc? **Code wins** — update doc. Promote to `AGENTS.md` after 3+ entities use pattern unchanged.
