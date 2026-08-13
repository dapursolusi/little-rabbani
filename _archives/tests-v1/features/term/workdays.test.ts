import {
  countEmptyWorkdays,
  findEarliestTermCoveringDate,
  listTermWorkdays,
} from '@/features/term/workdays';
import { describe, expect, it } from 'vitest';

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

describe('findEarliestTermCoveringDate', () => {
  const termA = {
    id: 'a',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    deletedAt: null,
  };
  const termB = {
    id: 'b',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    deletedAt: null,
  };

  it('returns the term covering the date', () => {
    const result = findEarliestTermCoveringDate([termA, termB], '2026-07-15');
    expect(result?.id).toBe('a');
  });

  it('includes the startDate and endDate (inclusive bounds)', () => {
    expect(findEarliestTermCoveringDate([termA, termB], '2026-07-01')?.id).toBe(
      'a'
    );
    expect(findEarliestTermCoveringDate([termA, termB], '2026-07-31')?.id).toBe(
      'a'
    );
  });

  it('includes 2026-08-01 which starts termB', () => {
    expect(findEarliestTermCoveringDate([termA, termB], '2026-08-01')?.id).toBe(
      'b'
    );
  });

  it('returns null for a date between two terms', () => {
    const gap = {
      id: 'g',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
      deletedAt: null,
    };
    // termB starts 08-01; 2026-07-20 falls in the gap between the two.
    expect(findEarliestTermCoveringDate([gap, termB], '2026-07-20')).toBeNull();
  });

  it('returns the earliest startDate when terms overlap', () => {
    const later = {
      id: 'c',
      startDate: '2026-08-15',
      endDate: '2026-09-30',
      deletedAt: null,
    };
    // Both later and termB cover 2026-08-20; termB starts earlier.
    const result = findEarliestTermCoveringDate([later, termB], '2026-08-20');
    expect(result?.id).toBe('b');
  });

  it('skips deleted terms', () => {
    const deleted = { ...termA, deletedAt: new Date() };
    expect(
      findEarliestTermCoveringDate([deleted, termB], '2026-07-15')
    ).toBeNull(); // termB starts 08-01, doesn't cover 07-15
  });
});
