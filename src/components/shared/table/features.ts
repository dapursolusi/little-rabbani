'use client';

// TanStack Table v9 feature set shared by all DataTable instances.
// Features are tree-shakeable — register only what the tables use.
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table';

import {
  rangeFilterFn,
  selectFilterFn,
  textFilterFn,
} from './filters/builtins';
import type { TColumnFilter } from './filters/types';

/** Column `meta` shape for every DataTable column (v9 `columnMeta` slot). */
interface AppColumnMeta {
  title: string;
  enableSearch?: boolean;
  filter?: TColumnFilter;
}

/** Shared v9 feature set. Keep module-level — stable reference for React Compiler. */
export const tableFeaturesConfig = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  // Custom registry filters — columns reference these by string name (`filterFn`).
  filterFns: {
    select: selectFilterFn,
    text: textFilterFn,
    range: rangeFilterFn,
  },
  // Type-only slot: types `ColumnDef.meta` across all DataTable columns.
  columnMeta: {} as AppColumnMeta,
});

/** The concrete feature type — use as the first generic in ColumnDef/Table/etc. */
export type AppTableFeatures = typeof tableFeaturesConfig;
