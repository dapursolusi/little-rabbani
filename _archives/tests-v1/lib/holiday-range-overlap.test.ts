import { describe, expect, it } from 'vitest';

import { holidayRangeOverlap } from '@/lib/holiday-range-overlap';

describe('holidayRangeOverlap', () => {
  const holidays = [
    { startDate: '2026-07-20', endDate: '2026-07-25' },
    { startDate: '2026-08-01', endDate: '2026-08-01' },
  ];

  it('returns true for date inside range', () => {
    expect(holidayRangeOverlap('2026-07-22', holidays)).toBe(true);
  });

  it('returns true for range start date', () => {
    expect(holidayRangeOverlap('2026-07-20', holidays)).toBe(true);
  });

  it('returns true for range end date', () => {
    expect(holidayRangeOverlap('2026-07-25', holidays)).toBe(true);
  });

  it('returns true for single-day holiday', () => {
    expect(holidayRangeOverlap('2026-08-01', holidays)).toBe(true);
  });

  it('returns false for date before range', () => {
    expect(holidayRangeOverlap('2026-07-19', holidays)).toBe(false);
  });

  it('returns false for date after range', () => {
    expect(holidayRangeOverlap('2026-07-26', holidays)).toBe(false);
  });

  it('returns false for empty holidays array', () => {
    expect(holidayRangeOverlap('2026-07-22', [])).toBe(false);
  });
});
