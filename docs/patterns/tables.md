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

## RowActionsDialog

`src/components/shared/table/row-actions-dialog.tsx` — two modes:

1. **Edit link** (`edit: { href: string }`) — navigates to a dedicated edit page
2. **Inline edit** (`edit: { schema, formFields, action, initialData }`) — opens a modal with `FormFieldGenerator`

`DataTableRowActions` (`src/components/shared/table/row-actions.tsx`) — the actual dropdown menu component. Handles edit + delete with confirmation dialog.

## Page usage

```tsx
<DataTable
  columns={entityColumns}
  data={data}
  meta={{ label: 'Entity', domain: 'entity' }}
  createHref="/dashboard/entity/create"
  // or modal form:
  createForm={{
    createForm: <EntityForm />,
    meta: { label: 'Entity', domain: 'entity' },
  }}
/>
```

## Search & filtering

- `meta.enableSearch` — opt-in per column for global search
- `meta.filter` — column-level filter config (`{ type: 'select', options: [...] }` or custom `filterFn`)
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

Pass `paginationInfo` to child components, not `table.getCanNextPage()`.

## Mobile view

`DataTableMobileView` renders rows as cards on small screens. Hidden on `md:`.

## Column visibility

Optional — pass `showColumnVisibility` to enable.

## Empty state

When `data.length === 0`, renders `EmptyState` component with create button.

## Dual-entity tab page

Two related entities on one page via `ContentTabs` + two `DataTable` instances. Parent tab (e.g. Theme) + child tab (SubTheme). Each tab has its own columns, data, and create form:

```tsx
import ContentTabs from '@/components/shared/content-tabs';

const tabs = [
  {
    triggerValue: 'parent',
    triggerLabel: 'Parent',
    icon: ParentIcon,
    children: (
      <DataTable
        columns={parentColumns}
        data={parents}
        meta={{ label: 'Parent' }}
        createForm={{
          createForm: <ParentForm />,
          meta: { label: 'Parent', domain: 'parent' },
        }}
      />
    ),
  },
  {
    triggerValue: 'child',
    triggerLabel: 'Child',
    icon: ChildIcon,
    children: (
      <DataTable
        columns={childColumns}
        data={children}
        meta={{ label: 'Child' }}
        createForm={{
          createForm: <ChildForm />,
          meta: { label: 'Child', domain: 'child' },
        }}
      />
    ),
  },
];

return <ContentTabs tabs={tabs} />;
```

Child columns often need parent data for select options — pass it via a factory function (`createChildColumns(parents)`). Both datasets are fetched in parallel in the Server Component page.

## Filters

- `src/components/shared/table/filters/builtins.ts` — built-in filter functions (select, text, range)
- `src/components/shared/table/filters/registry.ts` — filter component registry
- `src/components/shared/table/filters/types.ts` — `TColumnFilter` type
