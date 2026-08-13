// src/components/shared/table/filters/builtins.ts
import { RangeFilter, rangeFilterFn } from './range-filter';
import { registerFilter } from './registry';
import { SelectFilter, selectFilterFn } from './select-filter';
import { TextFilter, textFilterFn } from './text-filter';

// Run at import time — idempotent, the registry overwrites on duplicate keys.
registerFilter('select', SelectFilter, selectFilterFn);
registerFilter('text', TextFilter, textFilterFn);
registerFilter('range', RangeFilter, rangeFilterFn);
