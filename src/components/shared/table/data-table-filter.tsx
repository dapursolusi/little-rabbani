// src/components/shared/table/data-table-filter.tsx
'use client';

import * as React from 'react';

import {
  ArrowDown01Icon,
  Cancel01Icon,
  FilterAddIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type {
  ColumnDef,
  ColumnFiltersState,
  Table,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { getFilter } from './filters/registry';
import {
  type FilterComponentProps,
  type TColumnFilter,
  isRegistryFilter,
} from './filters/types';

/** Derive distinct values for a column from the table's row model. */
function deriveOptions<TData>(
  table: Table<TData>,
  columnId: string
): { label: string; value: string }[] {
  const values = new Set<string>();
  table.getRowModel().rows.forEach((row) => {
    const val = row.getValue(columnId);
    if (val != null) values.add(String(val));
  });
  return Array.from(values)
    .sort()
    .map((v) => ({ label: v, value: v }));
}

/** Extract filterable columns from the column definitions. */
function getFilterableColumns<TData, TValue>(
  columns: ColumnDef<TData, TValue>[]
) {
  return columns
    .filter((col) => {
      const meta = (col as { meta?: { filter?: TColumnFilter } }).meta;
      return meta?.filter !== undefined;
    })
    .map((col) => {
      const meta = (
        col as { meta?: { filter?: TColumnFilter; title?: string } }
      ).meta!;
      const columnId =
        'id' in col && typeof col.id === 'string'
          ? col.id
          : 'accessorKey' in col && typeof col.accessorKey === 'string'
            ? col.accessorKey
            : 'unknown';
      return { columnId, title: meta.title ?? columnId, filter: meta.filter! };
    });
}

type TFilterableColumn = {
  columnId: string;
  title: string;
  filter: TColumnFilter;
};

interface FilterContextValue {
  table: Table<Record<string, unknown>>;
  filterableColumns: TFilterableColumn[];
  inactiveColumns: TFilterableColumn[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  handleSetFilter: (id: string, value: unknown) => void;
  handleRemoveFilter: (id: string) => void;
}

const FilterContext = React.createContext<FilterContextValue | null>(null);

function useFilterContext() {
  const ctx = React.useContext(FilterContext);
  if (ctx === null) {
    throw new Error('useFilterContext must be used within a DataTableFilter');
  }
  return ctx;
}

function DataTableFilterButton() {
  const ctx = useFilterContext();
  return (
    <>
      {ctx.inactiveColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="default"
                size="sm"
                className="h-8 flex items-center gap-1 "
              >
                <HugeiconsIcon icon={FilterAddIcon} strokeWidth={2} />
                Filter
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            {ctx.inactiveColumns.map((col) => (
              <DropdownMenuItem
                key={col.columnId}
                onClick={() =>
                  ctx.onColumnFiltersChange([
                    ...ctx.columnFilters,
                    { id: col.columnId, value: undefined },
                  ])
                }
              >
                {col.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

function DataTableFilterBar() {
  const ctx = useFilterContext();

  // Active filter pills: merge columnFilters with their column metadata
  const activeFilters = ctx.columnFilters
    .map((f) => {
      const col = ctx.filterableColumns.find((c) => c.columnId === f.id);
      return col ? { id: f.id, value: f.value, column: col } : null;
    })
    .filter(Boolean) as Array<{
    id: string;
    value: unknown;
    column: { columnId: string; title: string; filter: TColumnFilter };
  }>;

  return (
    <div
      className={`grid transition-all duration-300 ease-in-out ${
        activeFilters.length > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap p-2 bg-accent/30 rounded-lg mb-3">
          {activeFilters.map((af) => {
            // Resolve the filter component
            const column = ctx.table.getColumn(af.column.columnId)!;

            let FilterComponent: React.ComponentType<FilterComponentProps> | null =
              null;

            if (isRegistryFilter(af.column.filter)) {
              const registration = getFilter(af.column.filter.type);
              if (registration) {
                FilterComponent = registration.component;
              }
            } else {
              FilterComponent = af.column.filter.component;
            }

            // For select: use explicit options or auto-derive from data
            let options: { label: string; value: string }[] | undefined;
            if (
              isRegistryFilter(af.column.filter) &&
              af.column.filter.type === 'select'
            ) {
              options =
                af.column.filter.options ??
                deriveOptions(ctx.table, af.column.columnId);
            }

            return (
              <div
                key={af.id}
                className="flex items-center gap-1 rounded-md border bg-accent/30 px-2 py-1 text-sm"
              >
                <span className="font-medium whitespace-nowrap">
                  {af.column.title}
                </span>
                {FilterComponent && (
                  <FilterComponent
                    column={column as never}
                    value={af.value}
                    onChange={(v) => ctx.handleSetFilter(af.id, v)}
                    options={options}
                  />
                )}
                <button
                  onClick={() => ctx.handleRemoveFilter(af.id)}
                  className="ml-1 rounded p-0.5 hover:bg-muted"
                  aria-label={`Hapus filter ${af.column.title}`}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DataTableFilterProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
  children: React.ReactNode;
}

function DataTableFilter<TData, TValue>({
  table,
  columns,
  columnFilters,
  onColumnFiltersChange,
  children,
}: DataTableFilterProps<TData, TValue>) {
  const filterableColumns = getFilterableColumns(columns);

  // Columns not currently active as filters
  const inactiveColumns = filterableColumns.filter(
    (col) => !columnFilters.some((f) => f.id === col.columnId)
  );

  const handleSetFilter = (id: string, value: unknown) => {
    const existing = columnFilters.find((f) => f.id === id);
    if (existing) {
      onColumnFiltersChange(
        columnFilters.map((f) => (f.id === id ? { ...f, value } : f))
      );
    } else {
      onColumnFiltersChange([...columnFilters, { id, value }]);
    }
  };

  const handleRemoveFilter = (id: string) => {
    onColumnFiltersChange(columnFilters.filter((f) => f.id !== id));
  };

  return (
    <FilterContext.Provider
      value={{
        table: table as Table<Record<string, unknown>>,
        filterableColumns,
        columnFilters,
        inactiveColumns,
        handleSetFilter,
        handleRemoveFilter,
        onColumnFiltersChange,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

DataTableFilter.Button = DataTableFilterButton;
DataTableFilter.Bar = DataTableFilterBar;

export { DataTableFilter };
