import { describe, expect, it } from 'vitest';

import { countEmptyWorkdays, listTermWorkdays } from '@/features/term/workdays';

describe('listTermWorkdays', () => {
  it('returns every weekday in a clean week', () => {
    const term = { startDate: '2026-07-13', endDate: '2026-07-17' }; // Mon–Fri
    expect(listTermWorkdays(term, [], true)).toEqual([
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
    ]);
  });

  it('skips a holiday range inside the term', () => {
    const term = { startDate: '2026-07-13', endDate: '2026-07-17' };
    const holidays = [{ startDate: '2026-07-14', endDate: '2026-07-15' }];
    expect(listTermWorkdays(term, holidays, true)).toEqual([
      '2026-07-13',
      '2026-07-16',
      '2026-07-17',
    ]);
  });

  it('does not consume a workday for a weekend holiday inside the term', () => {
    const term = { startDate: '2026-07-13', endDate: '2026-07-24' };
    const holidays = [{ startDate: '2026-07-18', endDate: '2026-07-19' }]; // Sat–Sun
    expect(listTermWorkdays(term, holidays, true)).toHaveLength(10); // 5 + 5 weekdays
  });

  it('keeps days before and after a term-spanning holiday range', () => {
    const term = { startDate: '2026-07-13', endDate: '2026-07-24' };
    const holidays = [{ startDate: '2026-07-20', endDate: '2026-07-21' }]; // Mon–Tue
    expect(listTermWorkdays(term, holidays, true)).toEqual([
      '2026-07-13',
      '2026-07-14',
      '2026-07-15',
      '2026-07-16',
      '2026-07-17',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
    ]);
  });

  it('returns an empty array when no session type is active', () => {
    const term = { startDate: '2026-07-13', endDate: '2026-07-17' };
    expect(listTermWorkdays(term, [], false)).toEqual([]);
  });
});

describe('countEmptyWorkdays', () => {
  const term = { startDate: '2026-07-13', endDate: '2026-07-17' }; // 5 workdays

  it('subtracts filled curriculum items from workdays', () => {
    expect(countEmptyWorkdays(term, [], true, 2)).toBe(3);
  });

  it('clamps to zero when filled items exceed workdays', () => {
    expect(countEmptyWorkdays(term, [], true, 5)).toBe(0);
    expect(countEmptyWorkdays(term, [], true, 99)).toBe(0);
  });
});
