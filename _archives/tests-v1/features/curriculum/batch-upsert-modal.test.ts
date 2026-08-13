import { positionToSortOrder } from '@/features/curriculum/components/batch-upsert-modal';
import { describe, expect, it } from 'vitest';

describe('positionToSortOrder', () => {
  it('converts 1-based workday position to 0-based sortOrder', () => {
    expect(positionToSortOrder(1)).toBe(0);
    expect(positionToSortOrder(25)).toBe(24);
  });

  it('never emits a 1-based sortOrder (regression: overwrites next workday)', () => {
    // The DB stores 0-based sortOrder; a 1-based value would make batchUpsert
    // match a different workday's existing row and silently replace it.
    for (let p = 1; p <= 100; p++) {
      expect(positionToSortOrder(p)).toBe(p - 1);
    }
  });
});
