'use client';

import * as React from 'react';

import Link from 'next/link';

import { Add02Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  type CellData,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type RowData,
  type SortingState,
  flexRender,
  useTable,
} from '@tanstack/react-table';

import { buttonVariants } from '@/components/ui/button';
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

import { cn } from '@/lib/utils';

import { EmptyState } from '../empty-state';
import { Modal } from '../modal';
import DataTableColumnVisibility from './data-table-column-visibility';
import { DataTableFilter } from './data-table-filter';
import { DataTableMobileView } from './data-table-mobile-view';
import { DataTablePagination } from './data-table-pagination';
import DataTableSearchBar from './data-table-search-bar';
import type { AppTableFeatures } from './features';
import { tableFeaturesConfig } from './features';
import './filters/builtins';
import { type TColumnFilter, isRegistryFilter } from './filters/types';
import type { TableFormProps } from './table-form';

// React Compiler memoizes reads on TanStack Table's stable column handle, so
// column.getIsSorted() goes stale. Mirror sorting into React context and read
// the direction from there — same root-cause fix as pagination (AGENTS.md).
export const SortingStateContext = React.createContext<SortingState>([]);

interface SaveModalProps {
  metaLabel: string;
  form: TableFormProps;
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}

function SaveModal({ metaLabel, form, open, onOpenChange }: SaveModalProps) {
  return (
    <Modal
      title={`Simpan ${metaLabel}`}
      trigger={{ icon: Add02Icon, text: `Tambah ${metaLabel}` }}
      open={open}
      onOpenChange={onOpenChange}
      content={
        React.isValidElement<{ onSuccess?: () => void }>(form.createForm)
          ? React.cloneElement(form.createForm, {
              onSuccess: () => onOpenChange(false),
            })
          : form.createForm
      }
    />
  );
}

interface DataTableProps<TData extends RowData, TValue extends CellData> {
  columns: ColumnDef<AppTableFeatures, TData, TValue>[];
  data: TData[];
  meta: {
    domain?: string;
    label: string;
  };
  createForm?: TableFormProps;
  createHref?: string;
  emptyAction?: {
    actionHref?: string;
    action?: React.ReactNode;
  };
}

export function DataTable<TData extends RowData, TValue extends CellData>({
  columns,
  data,
  meta,
  createForm,
  createHref,
  emptyAction,
}: DataTableProps<TData, TValue>) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
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
  const tableColumns = React.useMemo<
    ColumnDef<AppTableFeatures, TData, unknown>[]
  >(
    () =>
      columns.map((column) => {
        const meta = (
          column as unknown as {
            meta?: { enableSearch?: boolean; filter?: TColumnFilter };
          }
        ).meta;

        const enriched: ColumnDef<AppTableFeatures, TData, unknown> = {
          ...(column as unknown as ColumnDef<AppTableFeatures, TData, unknown>),
          enableGlobalFilter: meta?.enableSearch === true,
        };

        // Wire column-level filterFn. Registry filter types resolve to the
        // string names registered in tableFeatures().filterFns; custom filters
        // carry their own FilterFn.
        if (meta?.filter) {
          if (isRegistryFilter(meta.filter)) {
            enriched.filterFn = meta.filter.type as never;
          } else {
            enriched.filterFn = meta.filter.filterFn as never;
          }
        }

        return enriched;
      }),
    [columns]
  );

  const table = useTable({
    features: tableFeaturesConfig,
    data,
    columns: tableColumns,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
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
        title={`Belum ada ${meta.label.toLowerCase()}`}
        description={`Mulai dengan menambahkan ${meta.label.toLowerCase()} baru.`}
        actionLabel={`Tambah ${meta.label}`}
        actionHref={emptyAction?.actionHref}
        action={
          emptyAction?.action ? (
            emptyAction.action
          ) : (
            <SaveModal
              metaLabel={meta.label}
              form={createForm as TableFormProps}
              open={modalOpen}
              onOpenChange={setModalOpen}
            />
          )
        }
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
            {createHref ? (
              <Link
                href={createHref}
                className={cn(buttonVariants({ variant: 'default' }))}
              >
                <HugeiconsIcon icon={PlusSignIcon} className="h-4 w-4 mr-2" />
                {`Tambah ${meta.label}`}
              </Link>
            ) : createForm ? (
              <SaveModal
                metaLabel={meta.label}
                form={createForm as TableFormProps}
                open={modalOpen}
                onOpenChange={setModalOpen}
              />
            ) : null}
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
                  <TableRow key={row.id}>
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
