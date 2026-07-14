// src/components/shared/table/filters/registry.ts
import type { ComponentType } from 'react';

import type { FilterFn } from '@tanstack/react-table';

import type { IFilterComponentProps } from './types';

export interface IFilterRegistration {
  component: ComponentType<IFilterComponentProps>;
  filterFn: FilterFn<unknown>;
}

const registry = new Map<string, IFilterRegistration>();

export function registerFilter(
  type: string,
  component: ComponentType<IFilterComponentProps>,
  filterFn: FilterFn<unknown>
): void {
  registry.set(type, { component, filterFn });
}

export function getFilter(type: string): IFilterRegistration | undefined {
  return registry.get(type);
}
