// src/components/shared/table/filters/types.ts
import type { ComponentType } from 'react';

import type { Column, FilterFn } from '@tanstack/react-table';

export type RegistryFilterType = 'select' | 'text' | 'range';

export interface FilterComponentProps {
  value: unknown;
  onChange: (value: unknown) => void;
  /** pre-computed options for select/multi-select (auto-derived or explicit) */
  options?: { label: string; value: string }[];
  /** TanStack column handle for custom filters that need metadata */
  column: Column<unknown, unknown>;
}

export interface RegistryFilter {
  type: RegistryFilterType;
  /** Override pill label. Falls back to column meta.title. */
  title?: string;
  /** Explicit options for select. Auto-derived from data if omitted. */
  options?: { label: string; value: string }[];
  /** range: minimum allowed value */
  min?: number;
  /** range: maximum allowed value */
  max?: number;
}

export interface CustomFilter<TData = unknown> {
  component: ComponentType<FilterComponentProps>;
  filterFn: FilterFn<TData>;
  title?: string;
}

export type TColumnFilter = RegistryFilter | CustomFilter<unknown>;

/** Discriminate between registry and custom filter types */
export function isRegistryFilter(
  filter: TColumnFilter
): filter is RegistryFilter {
  return 'type' in filter;
}

/** Shape of a range filter value */
export interface RangeValue {
  min?: number;
  max?: number;
}
