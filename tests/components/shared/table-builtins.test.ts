import { describe, expect, it } from 'vitest';

import { registerBuiltinFilters } from '@/components/shared/table/filters/builtins';
import { getFilter } from '@/components/shared/table/filters/registry';

describe('registerBuiltinFilters', () => {
  it('registers select, text, and range types', () => {
    registerBuiltinFilters();
    expect(getFilter('select')).toBeDefined();
    expect(getFilter('text')).toBeDefined();
    expect(getFilter('range')).toBeDefined();
  });

  it('is idempotent', () => {
    registerBuiltinFilters();
    // Should not throw, should not change state
    const select = getFilter('select');
    registerBuiltinFilters();
    expect(getFilter('select')).toBe(select);
  });
});
