// src/components/shared/table/filters/types.ts
import type { ComponentType } from 'react';

import type { FilterFn } from '@tanstack/react-table';

export interface IFilterComponentProps {
  value: unknown;
  onChange: (value: unknown) => void;
  /** pre-computed options for select/multi-select (auto-derived or explicit) */
  options?: { label: string; value: string }[];
}

export interface IRegistryFilter {
  type: 'select' | 'multi-select' | 'text' | 'range' | 'boolean';
  /** Override pill label. Falls back to column meta.title. */
  title?: string;
  /** Explicit options for select/multi-select. Auto-derived from data if omitted. */
  options?: { label: string; value: string }[];
  /** range: minimum allowed value */
  min?: number;
  /** range: maximum allowed value */
  max?: number;
}

export interface ICustomFilter<TData = unknown> {
  component: ComponentType<IFilterComponentProps>;
  filterFn: FilterFn<TData>;
  title?: string;
}

export type TColumnFilter = IRegistryFilter | ICustomFilter<unknown>;

/** Shape of a range filter value */
export interface IRangeValue {
  min?: number;
  max?: number;
}
