// src/components/shared/table/filters/registry.ts
import type { ComponentType } from 'react';

import type { FilterFn, RowData, TableFeatures } from '@tanstack/react-table';

import type { FilterComponentProps } from './types';
import type { RegistryFilterType } from './types';

export interface FilterRegistration {
  component: ComponentType<FilterComponentProps>;
  filterFn: FilterFn<TableFeatures, RowData>;
}

const registry = new Map<string, FilterRegistration>();

export function registerFilter(
  type: RegistryFilterType,
  component: ComponentType<FilterComponentProps>,
  filterFn: FilterFn<TableFeatures, RowData>
): void {
  registry.set(type, { component, filterFn });
}

export function getFilter(type: string): FilterRegistration | undefined {
  return registry.get(type);
}
