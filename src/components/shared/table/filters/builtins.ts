// src/components/shared/table/filters/builtins.ts
import { RangeFilter, rangeFilterFn } from './range-filter';
import { registerFilter } from './registry';
import { SelectFilter, selectFilterFn } from './select-filter';
import { TextFilter, textFilterFn } from './text-filter';

let registered = false;

/** Idempotent — safe to call multiple times (e.g. in DataTable render body). */
export function registerBuiltinFilters(): void {
  if (registered) return;
  registerFilter('select', SelectFilter, selectFilterFn);
  registerFilter('text', TextFilter, textFilterFn);
  registerFilter('range', RangeFilter, rangeFilterFn);
  registered = true;
}
