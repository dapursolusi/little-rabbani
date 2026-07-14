// tests/components/shared/table-filters-registry.test.ts
import { describe, expect, it } from 'vitest';

import {
  getFilter,
  registerFilter,
} from '@/components/shared/table/filters/registry';

const MockFilter = () => null;
function mockFilterFn() {
  return true;
}

describe('Filter registry', () => {
  it('returns undefined for unregistered type', () => {
    expect(getFilter('nonexistent')).toBeUndefined();
  });

  it('registers and retrieves a filter', () => {
    registerFilter('select', MockFilter, mockFilterFn);
    const entry = getFilter('select');
    expect(entry?.component).toBe(MockFilter);
    expect(entry?.filterFn).toBe(mockFilterFn);
  });

  it('overwrites on duplicate registration', () => {
    const NewMock = () => null;
    function newFn() {
      return false;
    }
    registerFilter('select', NewMock, newFn);
    const entry = getFilter('select');
    expect(entry?.component).toBe(NewMock);
    expect(entry?.filterFn).toBe(newFn);
  });
});
