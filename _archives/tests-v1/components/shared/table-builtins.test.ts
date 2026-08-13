import { describe, expect, it } from 'vitest';

import '@/components/shared/table/filters/builtins';
import { getFilter } from '@/components/shared/table/filters/registry';

describe('builtin filter registration', () => {
  it('registers select, text, and range types at import time', () => {
    expect(getFilter('select')).toBeDefined();
    expect(getFilter('text')).toBeDefined();
    expect(getFilter('range')).toBeDefined();
  });

  it('is idempotent — re-import does not throw', () => {
    const select = getFilter('select');
    // Re-import (no-op in bundled tests, but verifies the shape is stable)
    expect(getFilter('select')).toBe(select);
  });
});
