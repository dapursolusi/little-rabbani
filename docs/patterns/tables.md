# DataTable Patterns

## Stack

`@tanstack/react-table` v9. Shared `DataTable` component at `src/components/shared/table/data-table.tsx`.

## Feature set

Registered in `src/components/shared/table/features.ts`:

```ts
export const tableFeaturesConfig = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    select: selectFilterFn,
    text: textFilterFn,
    range: rangeFilterFn,
  },
  columnMeta: {} as AppColumnMeta,
});
export type AppTableFeatures = typeof tableFeaturesConfig;
```

`AppColumnMeta` types the `meta` slot: `{ title, enableSearch?, filter? }`.

## Column definitions

Columns live in `features/<entity>/columns.tsx` (`'use client'` — interactive cells), typed `ColumnDef<AppTableFeatures, Entity>[]`:

```tsx
export const entityColumns: ColumnDef<AppTableFeatures, Entity>[] = [
  {
    accessorKey: 'name',
    meta: { title: 'Nama', enableSearch: true },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name') ?? '-'}</span>
    ),
  },
  // ...
  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => (
      <RowActionsDialog
        id={row.original.id}
        rowName={row.original.name}
        title="Edit Entity"
        description="..."
        edit={{ href: `/dashboard/entity/${row.original.id}/edit` }}
        deleteAction={() => deleteEntity(row.original.id)}
      />
    ),
  },
];
```

Filter configs are registry-keyed: `filter: { type: 'select', options }` with optional `title`, `min`, `max`, and a `column` handle for custom filters (`filters/types.ts`).

Keep `columns.tsx` pure — export only the column array; context/state needed by cell renderers lives elsewhere (see violations.md for the current drift).

## RowActionsDialog

`src/components/shared/table/row-actions-dialog.tsx` — two modes:

1. **Edit link** (`edit: { href: string }`) — navigates to a dedicated edit page
2. **Inline edit** (`edit: { schema, formFields, action, initialData }`) — opens a modal with `FormFieldGenerator`

`DataTableRowActions` (`src/components/shared/table/row-actions.tsx`) — the actual dropdown menu component. Handles edit + delete with confirmation dialog; owns its own `toast.warning`/`toast.error` with overridable `toastMessage`.

## Page usage

```tsx
<DataTable
  columns={entityColumns}
  data={data}
  meta={{ label: 'Entity', domain: 'entity' }}
  emptyState={{ icon: ..., createFreshRow: ... }}   // required
  createForm={{ createForm: <EntityForm />, meta: { label: 'Entity', domain: 'entity' } }}
  toolbar={{ showSearchBar: true, showFilter: true }}
/>
```

Full props: `columns`, `data`, `meta`, `emptyState` (required — `icon` + `createFreshRow`), `createForm` (`TableFormProps { createForm, meta }`), `createHref`, `toolbar` (`showAll`/`showSearchBar`/`showFilter`/`showColumnVisibility`/`showCreateAction`), `customAction`, `getRowClassName`.

Create entry is a discriminated union `DataTableCreateRow` (`{ type: 'href', href } | { type: 'form', ... } | { type: 'custom', ... }`) — use `createForm` for modal creation, `createHref` for dedicated routes.

## Search & filtering

- `meta.enableSearch` — opt-in per column for global search
- `meta.filter` — column-level filter config (see filters/types.ts for the full registry shape)
- Search bar builds placeholder from enabled columns: `"Cari Nama atau Nama Wali…"`
- Filters reset to page 0 on change

## Pagination

Client-side (all data loaded at once). `DataTablePagination` component. State mirrored into `useState` to avoid React Compiler stale-read bug.

## React Compiler gotcha

Do not read live values off the stable `table` instance in render. Mirror pagination state:

```tsx
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
const pageCount = Math.max(1, Math.ceil(filteredRowCount / pagination.pageSize));
const paginationInfo = {
  canPreviousPage: pagination.pageIndex > 0,
  canNextPage: pagination.pageIndex < pageCount - 1,
  ...
};
```

Pass `paginationInfo` to child components, not `table.getCanNextPage()`. The same mirror-into-state idiom is institutionalized via `SortingStateContext` for column sort handles.

## Mobile view

`DataTableMobileView` renders rows as cards on small screens. Hidden on `md:`.

## Column visibility

Via the `toolbar` prop (`showColumnVisibility`), not a standalone prop.

## Empty state

Required prop. When `data.length === 0`, renders `EmptyState` with `createFreshRow` driving the create action (see [shared-ui.md](shared-ui.md) for the `EmptyDataAction` union).

## Dual-entity tab page

Two related entities on one page via `ContentTabs` + two `DataTable` instances. Parent tab (e.g. Theme) + child tab (SubTheme). Each tab has its own columns, data, and create form. Child columns often need parent data for select options — pass it via a factory function (`createSubThemeColumns(parents)`). Both datasets are fetched in parallel in the Server Component page.

## Filters

- `src/components/shared/table/filters/builtins.ts` — built-in filter functions (select, text, range)
- `src/components/shared/table/filters/registry.ts` — filter component registry
- `src/components/shared/table/filters/types.ts` — `TColumnFilter` type + `RegistryFilter`
