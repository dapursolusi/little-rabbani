// src/components/shared/table/data-table-filter-bar.tsx
'use client';

import { FilterAddIcon, FilterRemoveIcon } from '@hugeicons/core-free-icons';
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

import { registerBuiltinFilters } from './filters/builtins';
import { getFilter } from './filters/registry';
import type { TColumnFilter } from './filters/types';

interface IDataTableFilterBarProps<TData> {
  table: Table<TData>;
  columns: ColumnDef<TData, unknown>[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}

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
function getFilterableColumns<TData>(columns: ColumnDef<TData, unknown>[]) {
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

export default function DataTableFilterBar<TData>({
  table,
  columns,
  columnFilters,
  onColumnFiltersChange,
}: IDataTableFilterBarProps<TData>) {
  registerBuiltinFilters();

  const filterableColumns = getFilterableColumns(columns);

  if (filterableColumns.length === 0) return null;

  // Columns not currently active as filters
  const inactiveColumns = filterableColumns.filter(
    (col) => !columnFilters.some((f) => f.id === col.columnId)
  );

  // Active filter pills: merge columnFilters with their column metadata
  const activeFilters = columnFilters
    .map((f) => {
      const col = filterableColumns.find((c) => c.columnId === f.id);
      return col ? { id: f.id, value: f.value, column: col } : null;
    })
    .filter(Boolean) as Array<{
    id: string;
    value: unknown;
    column: { columnId: string; title: string; filter: TColumnFilter };
  }>;

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
    <div className="flex items-center gap-2 flex-wrap px-2 py-1">
      {inactiveColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="h-8">
                <HugeiconsIcon icon={FilterAddIcon} strokeWidth={2} />
                Filter
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            {inactiveColumns.map((col) => (
              <DropdownMenuItem
                key={col.columnId}
                onClick={() =>
                  onColumnFiltersChange([
                    ...columnFilters,
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

      {activeFilters.map((af) => {
        // Resolve the filter component
        let FilterComponent: React.ComponentType<{
          value: unknown;
          onChange: (value: unknown) => void;
          options?: { label: string; value: string }[];
        }> | null = null;

        if ('type' in af.column.filter) {
          const registration = getFilter(af.column.filter.type);
          if (registration) {
            FilterComponent = registration.component;
          }
        } else {
          FilterComponent = af.column.filter.component;
        }

        // For select/multi-select: use explicit options or auto-derive from data
        let options: { label: string; value: string }[] | undefined;
        if (
          'type' in af.column.filter &&
          (af.column.filter.type === 'select' ||
            af.column.filter.type === 'multi-select')
        ) {
          options =
            af.column.filter.options ??
            deriveOptions(table, af.column.columnId);
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
                value={af.value}
                onChange={(v) => handleSetFilter(af.id, v)}
                options={options}
              />
            )}
            <button
              onClick={() => handleRemoveFilter(af.id)}
              className="ml-1 rounded p-0.5 hover:bg-muted"
              aria-label={`Hapus filter ${af.column.title}`}
            >
              <HugeiconsIcon icon={FilterRemoveIcon} size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
