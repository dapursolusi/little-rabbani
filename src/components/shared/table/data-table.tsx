'use client';

import * as React from 'react';

import Link from 'next/link';

import { Add02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';

import DataTableColumnVisibility from './data-table-column-visibility';
import { DataTablePagination } from './data-table-pagination';
import DataTableSearchBar from './data-table-search-bar';

// React Compiler memoizes reads on TanStack Table's stable column handle, so
// column.getIsSorted() goes stale. Mirror sorting into React context and read
// the direction from there — same root-cause fix as pagination (AGENTS.md).
export const SortingStateContext = React.createContext<SortingState>([]);

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  createButton?: React.ReactNode | string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  createButton,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState<string>('');

  // Scoping to opt-in columns: a column participates in the global filter
  // only when its `meta.enableSearch` is true. Source of truth lives in each
  // ColumnDef's `meta`, out of the search bar — so the same flag that gates
  // filtering also builds the placeholder ("Cari Nama atau Nama Wali …").
  const searchableColumns = React.useMemo(
    () =>
      columns.filter(
        (column) =>
          (
            column as unknown as {
              meta?: { enableSearch?: boolean };
            }
          ).meta?.enableSearch === true
      ),
    [columns]
  );

  const searchPlaceholder = React.useMemo(() => {
    const labels = searchableColumns
      .map((column) => {
        const title = (
          column as unknown as {
            meta?: { title?: string };
          }
        ).meta?.title;
        return typeof title === 'string' && title.length > 0 ? title : null;
      })
      .filter((label): label is string => label !== null);
    return labels.length > 0 ? `Cari ${labels.join(' atau ')}…` : 'Cari…';
  }, [searchableColumns]);

  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(
    () =>
      columns.map((column) => ({
        ...column,
        enableGlobalFilter:
          (
            column as unknown as {
              meta?: { enableSearch?: boolean };
            }
          ).meta?.enableSearch === true,
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      // Reset to first page so a narrowing result never strands the view on an
      // empty page beyond the filtered set.
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    state: { pagination, sorting, columnVisibility, globalFilter },
  });

  // React Compiler memoizes JSX reads of the stable-identity `table` getters,
  // yielding stale pagination values. Derive from React state instead.
  const pageCount = Math.max(1, Math.ceil(data.length / pagination.pageSize));
  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex < pageCount - 1;

  return (
    <SortingStateContext.Provider value={sorting}>
      <div className="m-2 flex items-center gap-2 justify-between">
        <DataTableSearchBar
          table={table}
          globalFilter={globalFilter}
          placeholder={searchPlaceholder}
        />
        <DataTableColumnVisibility
          table={table}
          columnVisibility={columnVisibility}
        />
        {createButton && typeof createButton === 'string' ? (
          <Link
            href={createButton as string}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <HugeiconsIcon icon={Add02Icon} />
            Tambah Murid
          </Link>
        ) : (
          <>{createButton}</>
        )}
      </div>
      <div className="bg-table-body-bg overflow-hidden rounded-xl border-2! border-black/30">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="bg-table-header-bg text-table-header-fg text-sm font-semibold whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DataTablePagination
          table={table}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={pageCount}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
        />
      </div>
    </SortingStateContext.Provider>
  );
}
