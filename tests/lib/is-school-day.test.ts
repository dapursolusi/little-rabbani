import { describe, expect, it } from 'vitest';

import { isSchoolDay } from '@/lib/is-school-day';

const term = { startDate: '2026-07-01', endDate: '2026-08-31' };
const holidays = [{ startDate: '2026-07-20', endDate: '2026-07-25' }];

describe('isSchoolDay', () => {
  it('returns true for a weekday in term with no holiday and active session', () => {
    // 2026-07-01 is Wednesday
    expect(isSchoolDay('2026-07-01', term, holidays, true)).toBe(true);
  });

  it('returns false for weekend', () => {
    // 2026-07-05 is Sunday
    expect(isSchoolDay('2026-07-05', term, holidays, true)).toBe(false);
  });

  it('returns false for holiday range', () => {
    // 2026-07-22 is inside holiday range
    expect(isSchoolDay('2026-07-22', term, holidays, true)).toBe(false);
  });

  it('returns false when no active session type', () => {
    expect(isSchoolDay('2026-07-01', term, holidays, false)).toBe(false);
  });

  it('returns false for date before term start', () => {
    expect(isSchoolDay('2026-06-30', term, holidays, true)).toBe(false);
  });

  it('returns false for date after term end', () => {
    expect(isSchoolDay('2026-09-01', term, holidays, true)).toBe(false);
  });
});
