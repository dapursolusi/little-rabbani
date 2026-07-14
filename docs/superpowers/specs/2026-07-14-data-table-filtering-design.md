# Data Table Column Filtering — Design Spec

**Date:** 2026-07-14
**Status:** Design approved, pending plan

## Problem

The `DataTable` component (used on `/dashboard/owner/kid`, and future owner pages)
supports global text search but has no per-column filtering. For the Kid module,
status and term columns need simple select filters. Later, other columns (e.g.,
age) need custom filter logic that can't be expressed as a simple enum — for example,
age groups like "<3", "3–4", "5+".

The design must be **reusable across any column in any module**, and the filter
mechanism must be **extensible without modifying the DataTable core** (open/closed
principle).

## Approach: Column-meta-driven with registry escape hatch (Option C)

Column definitions declare filter intent in `meta.filter`. The DataTable reads
those metas and renders a **filter bar** between the toolbar and the table body.
For common filter types (`select`, `text`, `range`, etc.), the registry wires
both the UI component and the TanStack `filterFn` — the column author only writes
`type: 'select'`. For custom filters, the author passes a `component` + `filterFn`
pair; TypeScript enforces that both are present.

Filter logic uses **AND** — both the global search and all active column filters
must match for a row to appear. This is the most intuitive narrowing behavior.

## UI Structure

```
┌─ Toolbar (existing) ───────────────────────────────────┐
│ [Search bar]                [Kolom Aktif] [Tambah Data] │
└─────────────────────────────────────────────────────────┘
┌─ Filter Bar (NEW) ─────────────────────────────────────┐
│ [+ Filter ▼]  [Status: Terdaftar ×]  [Term: 2025 ×]    │
└─────────────────────────────────────────────────────────┘
┌─ Table (existing) ─────────────────────────────────────┐
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
┌─ Pagination (existing) ────────────────────────────────┘
```

### Filter Bar

- **Visibility:** Only renders when at least one column declares `meta.filter`.
- **"+ Filter" button:** Dropdown listing all filterable columns by their
  `meta.title`. Picking one adds an active pill.
- **Active pill:** Shows `[label: current-value]` with an × to remove.
  - **Edit mode (new/clicked):** The pill body renders the filter component
    (dropdown, input, range fields, or custom component).
  - **Read mode (after selection/blur):** The pill body shows the current value
    as text. Clicking the pill re-enters edit mode.
- **Removal:** Clicking × sets the filter value to `undefined`, removing the
  filter entirely.

## Components & Files

### New files

| File                                                          | Purpose                                                                           |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/components/shared/table/filters/registry.ts`             | Filter type registry — `Map<string, ComponentType<IFilterComponentProps>>`        |
| `src/components/shared/table/filters/types.ts`                | `IFilterComponentProps`, `TColumnFilter` discriminated union, filter option types |
| `src/components/shared/table/filters/select-filter.tsx`       | Built-in: single-select dropdown                                                  |
| `src/components/shared/table/filters/multi-select-filter.tsx` | Built-in: multi-select checkbox list                                              |
| `src/components/shared/table/filters/text-filter.tsx`         | Built-in: text input (debounced)                                                  |
| `src/components/shared/table/filters/range-filter.tsx`        | Built-in: min/max number inputs                                                   |
| `src/components/shared/table/data-table-filter-bar.tsx`       | Filter bar container — "+ Filter" dropdown + pill row                             |

### Modified files

| File                                         | Change                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/components/shared/table/data-table.tsx` | Add `columnFilters` state, wire to `useReactTable`, render `<DataTableFilterBar>` between toolbar and table |
| `src/features/kid/components/columns.tsx`    | Add `meta.filter: { type: 'select' }` to status and enrolledTermName columns                                |

### No changes to

- `src/app/dashboard/owner/kid/page.tsx` — filter config is colocated in columns, no page boilerplate
- `data-table-column-header.tsx`, `data-table-search-bar.tsx`, `data-table-pagination.tsx`, `data-table-column-visibility.tsx` — unchanged
- Any other owner pages — they adopt filtering when they add `meta.filter` to their columns

## Type Definitions

```ts
// filters/types.ts
interface IFilterComponentProps {
  column: Column<unknown, unknown>;
  value: unknown;
  onChange: (value: unknown) => void;
}

interface IRegistryFilter {
  type: 'select' | 'multi-select' | 'text' | 'range' | 'boolean';
  title?: string; // override pill label
  options?: { label: string; value: string }[]; // select/multi-select
  min?: number; // range: slider floor
  max?: number; // range: slider ceiling
}

interface ICustomFilter<TData = unknown> {
  component: ComponentType<IFilterComponentProps>; // required
  filterFn: FilterFn<TData>; // required — TS enforces
  title?: string;
}

type TColumnFilter = IRegistryFilter | ICustomFilter<unknown>;
```

**Why `filterFn` is required with `component`:** Without it, TanStack defaults
to `autoFilterFn` (`String(rowVal).includes(String(filterVal))`), which silently
does the wrong thing for range/date/custom filters. Making it required means
TypeScript catches the omission at compile time — no runtime surprises.

## Column Meta Shape (extension of existing)

```ts
// Existing meta (unchanged):
meta?: {
  title?: string;
  enableSearch?: boolean;
  // NEW:
  filter?: TColumnFilter;
}
```

## Usage Examples

### 1. Built-in select filter (status, term) — zero wiring

```tsx
{
  accessorKey: 'status',
  meta: {
    title: 'Status',
    filter: { type: 'select' },  // options auto-derived from data if not specified
  },
  header: 'Status',
  cell: ({ row }) => <Badge>{STATUS_BADGE[row.getValue('status')]}</Badge>,
}
```

The select filter auto-collects distinct values from the data column. Explicit
`options` can be passed to pin the list or control order.

### 2. Built-in range filter (numeric columns)

```tsx
{
  accessorKey: 'score',
  meta: { title: 'Nilai', filter: { type: 'range', min: 0, max: 100 } },
  header: 'Nilai',
}
```

### 3. Custom filter (age groups — future use case)

```tsx
{
  accessorKey: 'dob',
  meta: {
    title: 'Usia',
    filter: {
      component: AgeGroupFilter,   // custom UI component
      filterFn: ageGroupFilterFn,  // custom logic — TS requires both
    },
  },
  header: ({ column }) => <DataTableColumnHeader column={column} title="Usia" />,
  cell: ({ row }) => <span>{getAge(row.getValue('dob'))}</span>,
}

// age-group-filter.tsx — custom filter component
const GROUPS = [
  { label: '< 3 tahun', value: '0-2' },
  { label: '3–4 tahun', value: '3-4' },
  { label: '5+ tahun',  value: '5+' },
];
function AgeGroupFilter({ value, onChange }: IFilterComponentProps) {
  return (
    <select value={(value as string) ?? ''} onChange={e => onChange(e.target.value || undefined)}>
      <option value="">Semua</option>
      {GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
    </select>
  );
}

// age-group-filter-fn.ts — custom filter logic
const ageGroupFilterFn: FilterFn<KidRowData> = (row, columnId, value: string) => {
  const age = getAge(row.getValue(columnId));
  switch (value) {
    case '0-2': return age < 3;
    case '3-4': return age >= 3 && age <= 4;
    case '5+':  return age >= 5;
    default:    return true;
  }
};
```

### 4. Adding a new built-in type to the registry

```ts
// app startup (or feature init):
import { registerFilter } from '@/components/shared/table/filters/registry';

import { DateRangeFilter } from './date-range-filter';

registerFilter('date-range', DateRangeFilter); // includes its own filterFn internally

// Then in any column:
meta: {
  filter: {
    type: 'date-range';
  }
}
```

## State & Data Flow

```
Column meta.filter           →  Filter bar discovers filterable columns
User picks filter            →  Pill added, filter component renders
Component onChange(value)    →  setColumnFilters(prev => upsert(prev, { id, value }))
                                  ↓
                                  useReactTable state.columnFilters updates
                                  getFilteredRowModel() re-filters (AND with globalFilter)
                                  ↓
                                  Table re-renders with filtered rows
Pill × clicked               →  setColumnFilters(prev => remove(prev, id))
                                  ↓
                                  Filter removed, rows restored
```

- `columnFilters` is mirrored to React `useState<ColumnFiltersState>([])` — same
  React Compiler workaround pattern used for `sorting`, `pagination`, and
  `columnVisibility`.
- AND logic: TanStack's `getFilteredRowModel` already ANDs `columnFilters` with
  `globalFilter` when both are in state. No custom logic needed.

## Built-in Filter Behaviors

| Type           | UI                          | Default filterFn          | Options auto-detect             |
| -------------- | --------------------------- | ------------------------- | ------------------------------- |
| `select`       | `<select>` dropdown         | `equalsString`            | Yes — distinct values from data |
| `multi-select` | Checkbox list               | `arrIncludes`             | Yes — distinct values from data |
| `text`         | `<input>` debounced 300ms   | `includesString`          | N/A                             |
| `range`        | Two number inputs (min/max) | Custom (>= min && <= max) | Uses `min`/`max` from config    |
| `boolean`      | Tri-state toggle            | `equals`                  | N/A                             |

## React Compiler Notes

Same pattern as existing pagination/sorting/column-visibility state: TanStack
Table's `table` instance is a stable identity handle. The React Compiler
memoizes getter reads on it. All UI-derivable state (`columnFilters`) is
mirrored to `useState` and read from there — never from `table.getState()`.
Filter bar reads from React state for pills; mutations (`setColumnFilters`)
call the setter directly.

## Extension Points

1. **New built-in type:** `registerFilter('my-type', MyComponent)` — one call,
   then any column uses `type: 'my-type'`.
2. **Custom one-off filter:** `filter: { component: ..., filterFn: ... }` — no
   registry involved, TS enforces completeness.
3. **Filter bar placement:** The filter bar is a child of `DataTable`, not a
   slot. If a future page needs it elsewhere, we add a `filterBarPosition` prop.
   Out of scope until needed.
4. **Server-side filtering:** The `columnFilters` state could be lifted or
   exposed via a callback for server-side data fetching. TanStack's
   `manualFiltering` flag + an `onFiltersChange` prop would enable this. Out of
   scope for client-side use case.

## What's NOT Included

- **Persisted/saved filters:** No localStorage or URL query param syncing.
  Add when a user asks for "remember my filters."
- **Filter combination operators (AND/OR toggling):** Filters are always AND.
  Add OR when a user reports they need it.
- **Date-range picker:** Not a built-in type yet. Use `component` escape hatch
  with a date picker library when needed.
- **Server-side filtering:** All filtering is client-side against the loaded
  dataset. Add manual filtering mode when datasets exceed ~1000 rows.
