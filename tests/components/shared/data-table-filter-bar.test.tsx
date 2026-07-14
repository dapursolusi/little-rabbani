// tests/components/shared/data-table-filter-bar.test.tsx
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataTableFilter } from '@/components/shared/table/data-table-filter';
import { registerBuiltinFilters } from '@/components/shared/table/filters/builtins';
import { registerFilter } from '@/components/shared/table/filters/registry';

// Register builtins first so the component's registerBuiltinFilters() is a no-op,
// then override with FakeSelect for test predictability.
registerBuiltinFilters();
const FakeSelect = ({
  value,
  onChange,
  options,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  options?: { label: string; value: string }[];
}) => (
  <select
    data-testid="fake-select"
    value={(value as string) ?? ''}
    onChange={(e) => onChange(e.target.value || undefined)}
  >
    <option value="">--</option>
    {(options ?? []).map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

registerFilter('select', FakeSelect, () => true);

type TRow = { name: string; status: string };

const columns: ColumnDef<TRow>[] = [
  { accessorKey: 'name', meta: { title: 'Nama' } },
  {
    accessorKey: 'status',
    meta: { title: 'Status', filter: { type: 'select' } },
  },
  {
    id: 'customCol',
    accessorKey: 'name',
    meta: {
      title: 'Custom',
      filter: { component: FakeSelect, filterFn: () => true },
    },
  },
];

const data: TRow[] = [
  { name: 'Ahmad', status: 'enrolled' },
  { name: 'Budi', status: 'waiting' },
];

function TestWrapper({
  columnFilters = [],
  onColumnFiltersChange = () => {},
}: {
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnFilters },
    onColumnFiltersChange,
  });

  return (
    <DataTableFilter
      table={table}
      columns={columns}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
    >
      <DataTableFilter.Button />
      <DataTableFilter.Bar />
    </DataTableFilter>
  );
}

describe('DataTableFilterBar', () => {
  it('renders "+ Filter" button when filterable columns exist', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Filter')).toBeDefined();
  });

  it('adds a filter pill when a column is selected from dropdown', () => {
    let filters: ColumnFiltersState = [];
    render(
      <TestWrapper
        columnFilters={filters}
        onColumnFiltersChange={(updaterOrValue) => {
          filters =
            typeof updaterOrValue === 'function'
              ? updaterOrValue(filters)
              : updaterOrValue;
        }}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Filter'));
    // Click "Status" to add filter
    fireEvent.click(screen.getByText('Status'));

    expect(filters).toHaveLength(1);
    expect(filters[0].id).toBe('status');
    expect(filters[0].value).toBeUndefined();
  });

  it('renders active filter pills', () => {
    render(
      <TestWrapper columnFilters={[{ id: 'status', value: 'enrolled' }]} />
    );
    // The select component renders, pill label is "Status"
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByTestId('fake-select')).toBeDefined();
  });

  it('removes filter when X button is clicked', () => {
    let filters: ColumnFiltersState = [{ id: 'status', value: 'enrolled' }];
    render(
      <TestWrapper
        columnFilters={filters}
        onColumnFiltersChange={(updaterOrValue) => {
          filters =
            typeof updaterOrValue === 'function'
              ? updaterOrValue(filters)
              : updaterOrValue;
        }}
      />
    );

    fireEvent.click(screen.getByLabelText('Hapus filter Status'));
    expect(filters).toHaveLength(0);
  });

  it('renders custom filter component from meta.filter.component', () => {
    render(
      <TestWrapper columnFilters={[{ id: 'customCol', value: 'test' }]} />
    );
    // The custom column's pill label
    expect(screen.getByText('Custom')).toBeDefined();
    // FakeSelect renders
    expect(screen.getByTestId('fake-select')).toBeDefined();
  });

  it('returns null when no columns declare meta.filter', () => {
    const noFilterCols: ColumnDef<TRow>[] = [
      { accessorKey: 'name', meta: { title: 'Nama' } },
      { accessorKey: 'status', meta: { title: 'Status' } },
    ];

    function EmptyTable() {
      const table = useReactTable({
        data,
        columns: noFilterCols,
        getCoreRowModel: getCoreRowModel(),
      });
      return (
        <DataTableFilter
          table={table}
          columns={noFilterCols}
          columnFilters={[]}
          onColumnFiltersChange={() => {}}
        >
          <DataTableFilter.Bar />
        </DataTableFilter>
      );
    }

    const { container } = render(<EmptyTable />);
    expect(container.innerHTML).toBe('');
  });
});
