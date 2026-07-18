'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { Add02Icon } from '@hugeicons/core-free-icons';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
// Import-time side-effect: registers built-in filter types in the registry

import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { EmptyState } from '../empty-state';
import DefaultFormFields, {
  CreateUpdateFormProps,
} from '../form/default-form-field';
import { Modal } from '../modal';
import DataTableColumnVisibility from './data-table-column-visibility';
import { DataTableFilter } from './data-table-filter';
import { DataTableMobileView } from './data-table-mobile-view';
import { DataTablePagination } from './data-table-pagination';
import DataTableSearchBar from './data-table-search-bar';
import './filters/builtins';
import { getFilter } from './filters/registry';
import { type TColumnFilter, isRegistryFilter } from './filters/types';

// React Compiler memoizes reads on TanStack Table's stable column handle, so
// column.getIsSorted() goes stale. Mirror sorting into React context and read
// the direction from there — same root-cause fix as pagination (AGENTS.md).
export const SortingStateContext = React.createContext<SortingState>([]);

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta: {
    domain?: string;
    label: string;
  };
  form: CreateUpdateFormProps;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  form,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState<string>('');
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
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

  // Enrich columns with filterFn from registry or custom meta, plus wire
  // enableGlobalFilter the same way as before.
  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(
    () =>
      columns.map((column) => {
        const meta = (
          column as unknown as {
            meta?: { enableSearch?: boolean; filter?: TColumnFilter };
          }
        ).meta;

        const enriched: ColumnDef<TData, TValue> = {
          ...column,
          enableGlobalFilter: meta?.enableSearch === true,
        };

        // Wire column-level filterFn from registry or custom meta
        if (meta?.filter) {
          if (isRegistryFilter(meta.filter)) {
            const registration = getFilter(meta.filter.type);
            if (registration) {
              enriched.filterFn = registration.filterFn as never;
            }
          } else {
            enriched.filterFn = meta.filter.filterFn as never;
          }
        }

        return enriched;
      }),
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
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      // Reset to first page when a column filter changes — same rationale as
      // the global-filter guard above.
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    state: {
      pagination,
      sorting,
      columnVisibility,
      globalFilter,
      columnFilters,
    },
  });

  // React Compiler memoizes JSX reads of the stable-identity `table` getters,
  // yielding stale pagination values when state changes but identity doesn't.
  // The filtered row model's rows array reference changes whenever columnFilters
  // or globalFilter update and triggers a re-render, so .length is safe here.
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(
    1,
    Math.ceil(filteredRowCount / pagination.pageSize)
  );

  const paginationInfo = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    pageCount,
    filteredRowCount,
    canPreviousPage: pagination.pageIndex > 0,
    canNextPage: pagination.pageIndex < pageCount - 1,
  };

  if (data.length === 0) {
    return (
      <EmptyState
        title={'Belum ada data'}
        description={'Mulai dengan menambahkan murid baru.'}
        actionLabel={'Tambah Murid'}
        actionHref={'/dashboard/owner/kid/create'}
      />
    );
  }

  return (
    <SortingStateContext.Provider value={sorting}>
      <DataTableFilter
        table={table}
        columns={columns}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
      >
        <div className="my-2 flex max-md:flex-col items-center gap-2 justify-between">
          <DataTableSearchBar
            table={table}
            globalFilter={globalFilter}
            placeholder={searchPlaceholder}
          />
          <div className="flex items-center gap-2 max-md:w-full max-md:justify-between">
            <DataTableFilter.Button />
            <DataTableColumnVisibility
              table={table}
              columnVisibility={columnVisibility}
            />
            <Modal
              title={`Tambah ${meta.label}`}
              trigger={{ icon: Add02Icon, text: `Tambah ${meta.label}` }}
              content={
                <DefaultFormFields
                  {...form}
                  onSubmit={async (data) => {
                    const result = await form.onSubmit?.(data);
                    if (result) {
                      const r = result as { success: boolean; error?: string };
                      if (r.success) {
                        toast.success(`${meta.label} berhasil ditambahkan`);
                        router.refresh();
                      } else {
                        toast.error(r.error ?? 'Gagal menyimpan data');
                      }
                    }
                  }}
                >
                  <DialogFooter>
                    <DialogClose
                      render={<Button variant="outline">Batal</Button>}
                    />
                    <Button type="submit">Simpan</Button>
                  </DialogFooter>
                </DefaultFormFields>
              }
            />
          </div>
        </div>
        <DataTableFilter.Bar />
      </DataTableFilter>
      <div className="md:bg-table-body-bg overflow-hidden rounded-lg border-2! border-black/30">
        <div className="hidden overflow-x-auto md:block">
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
                    Tidak ada data ditemukan. Coba cari dengan kata kunci lain.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTableMobileView rows={table.getRowModel().rows} />
        <Separator />
        <DataTablePagination table={table} pagination={paginationInfo} />
      </div>
    </SortingStateContext.Provider>
  );
}
