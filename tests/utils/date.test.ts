import { describe, expect, it } from 'vitest';

import { isWithinEditWindow } from '@/utils/date';
import { getLocalDateString } from '@/utils/date-local';

describe('getLocalDateString', () => {
  it('formats a fixed instant in Jakarta timezone', () => {
    // 2026-07-01 18:00 UTC = 2026-07-02 01:00 WIB
    const now = new Date('2026-07-01T18:00:00Z');
    expect(getLocalDateString({ now })).toBe('2026-07-02');
  });

  it('formats a fixed instant in a non-default timezone', () => {
    const now = new Date('2026-07-01T18:00:00Z');
    expect(getLocalDateString({ timeZone: 'UTC', now })).toBe('2026-07-01');
  });
});

describe('isWithinEditWindow', () => {
  const now = new Date('2026-07-10T10:00:00Z'); // local 2026-07-10 WIB

  it('accepts today', () => {
    expect(isWithinEditWindow('2026-07-10', { now })).toBe(true);
  });

  it('accepts a date exactly 7 days back', () => {
    expect(isWithinEditWindow('2026-07-03', { now })).toBe(true);
  });

  it('rejects a date 8 days back', () => {
    expect(isWithinEditWindow('2026-07-02', { now })).toBe(false);
  });

  it('rejects future dates', () => {
    expect(isWithinEditWindow('2026-07-11', { now })).toBe(false);
  });
});
