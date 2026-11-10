import {
  buildEligibleMonths,
  buildReportableMonths,
  isTermFinalMonth,
  monthEndDate,
  monthKeysBetween,
  overlapDays,
  resolveTermForMonth,
  termOverlapsMonth,
  termsOverlappingMonth,
} from '@/features/report/utils';
import { Term } from '@/features/term/types';
import { describe, expect, it } from 'vitest';

function makeTerm(
  id: string,
  name: string,
  startDate: string,
  endDate: string
): Term {
  return {
    id,
    name,
    startDate,
    endDate,
    isAutoCreated: false,
  };
}

// The task's canonical example: gaps must be skipped, not disabled.
const TERM_1 = makeTerm('t1', 'Term 1', '2026-03-01', '2026-06-30');
const TERM_2 = makeTerm('t2', 'Term 2', '2026-07-01', '2026-10-31');
const TERM_3 = makeTerm('t3', 'Term 3', '2026-11-01', '2027-02-28');
const ALL_TERMS = [TERM_1, TERM_2, TERM_3];

const VALID_UUID = 'b3c1d2e4-0000-4000-8000-000000000002';

describe('month helpers', () => {
  it('monthEndDate handles leap and non-leap Februaries', () => {
    expect(monthEndDate('2026-02')).toBe('2026-02-28');
    expect(monthEndDate('2028-02')).toBe('2028-02-29');
    expect(monthEndDate('2026-12')).toBe('2026-12-31');
  });

  it('monthKeysBetween spans year boundaries inclusively', () => {
    expect(monthKeysBetween('2026-11-01', '2027-02-28')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
  });

  it('overlapDays counts the shared calendar days', () => {
    // Term ends Aug 15, so August overlaps 15 days.
    const term = makeTerm('t', 'T', '2026-06-01', '2026-08-15');
    expect(overlapDays(term, '2026-08')).toBe(15);
    // Term starts mid-month: 16th → 31st = 16 days.
    const late = makeTerm('t2', 'T2', '2026-08-16', '2026-12-01');
    expect(overlapDays(late, '2026-08')).toBe(16);
  });
});

describe('buildEligibleMonths', () => {
  it('single enrolled term restricts navigation to that term only', () => {
    expect(buildEligibleMonths([TERM_1])).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
  });

  it('non-consecutive terms skip the unenrolled term entirely', () => {
    // Term 2 is NOT enrolled — July–October must not appear.
    expect(buildEligibleMonths([TERM_1, TERM_3])).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
  });

  it('de-duplicates months shared by overlapping terms', () => {
    const overlapping = makeTerm('t9', 'T9', '2026-08-16', '2026-12-15');
    const months = buildEligibleMonths([TERM_1, overlapping]);
    expect(new Set(months).size).toBe(months.length);
    expect(months).toEqual([...months].sort());
  });

  it('returns nothing when the kid has no enrollments', () => {
    expect(buildEligibleMonths([])).toEqual([]);
  });
});

describe('termOverlapsMonth', () => {
  it('accepts a month touching only the first or last day', () => {
    const short = makeTerm('t', 'T', '2026-08-31', '2026-08-31');
    expect(termOverlapsMonth(short, '2026-08')).toBe(true);
  });

  it('rejects months outside the term range', () => {
    expect(termOverlapsMonth(TERM_1, '2026-07')).toBe(false);
  });
});

describe('resolveTermForMonth', () => {
  it('preserves a requested termId that is eligible for the month', () => {
    const result = resolveTermForMonth({
      terms: [TERM_1, TERM_3],
      yearMonth: '2026-06',
      requestedTermId: TERM_1.id,
    });
    expect(result?.id).toBe(TERM_1.id);
  });

  it('falls back to a valid term when the requested termId is stale', () => {
    const result = resolveTermForMonth({
      terms: [TERM_1],
      yearMonth: '2026-03',
      requestedTermId: VALID_UUID,
    });
    expect(result?.id).toBe(TERM_1.id);
  });

  it('prefers the ongoing term over overlap', () => {
    const ongoing = makeTerm('ongoing', 'O', '2026-08-01', '2026-08-15');
    const large = makeTerm('large', 'L', '2026-08-16', '2026-09-30');
    const result = resolveTermForMonth({
      terms: [large, ongoing],
      yearMonth: '2026-08',
      today: '2026-08-03',
    });
    expect(result?.id).toBe(ongoing.id);
  });

  it('picks the term with the greatest overlap when none is ongoing', () => {
    // Term 1 ends Aug 15 (15 days), term 2 covers the rest (16 days).
    const endingTerm = makeTerm('ending', 'E', '2026-06-01', '2026-08-15');
    const startingTerm = makeTerm('starting', 'S', '2026-08-16', '2026-12-01');
    const result = resolveTermForMonth({
      terms: [endingTerm, startingTerm],
      yearMonth: '2026-08',
      today: '2027-01-01',
    });
    expect(result?.id).toBe(startingTerm.id);
  });

  it('breaks overlap ties with the later start date', () => {
    // Both start before August and run past it — full 31-day overlap each.
    const first = makeTerm('first', 'F', '2026-07-01', '2026-12-15');
    const second = makeTerm('second', 'S', '2026-08-01', '2026-12-31');
    const result = resolveTermForMonth({
      terms: [first, second],
      yearMonth: '2026-08',
      today: '2027-01-01',
    });
    expect(result?.id).toBe(second.id);
  });

  it('returns null when the month has no eligible term', () => {
    expect(resolveTermForMonth({ terms: [], yearMonth: '2026-08' })).toBeNull();
  });
});

describe('termsOverlappingMonth', () => {
  it('returns both terms when a month is shared', () => {
    const endingTerm = makeTerm('ending', 'E', '2026-06-01', '2026-08-15');
    const startingTerm = makeTerm('starting', 'S', '2026-08-16', '2026-12-01');
    const result = termsOverlappingMonth([endingTerm, startingTerm], '2026-08');
    expect(result.map((t) => t.id)).toEqual(['ending', 'starting']);
  });

  it('returns one term for a normal month', () => {
    expect(termsOverlappingMonth(ALL_TERMS, '2026-04')).toHaveLength(1);
  });
});

describe('isTermFinalMonth', () => {
  it('is true only for the month containing the term end date', () => {
    expect(isTermFinalMonth(TERM_1, '2026-06')).toBe(true);
    expect(isTermFinalMonth(TERM_1, '2026-05')).toBe(false);
  });

  it('distinguishes two terms sharing the same calendar month', () => {
    const endingTerm = makeTerm('ending', 'E', '2026-06-01', '2026-08-15');
    const startingTerm = makeTerm('starting', 'S', '2026-08-16', '2026-12-01');
    expect(isTermFinalMonth(endingTerm, '2026-08')).toBe(true);
    expect(isTermFinalMonth(startingTerm, '2026-08')).toBe(false);
  });
});

describe('buildReportableMonths', () => {
  const OCT_DEC = makeTerm('t', 'T', '2026-10-01', '2026-12-31');

  it('drops future months — the task example (Nov 6, term Oct–Dec)', () => {
    expect(buildReportableMonths([OCT_DEC], '2026-11-06')).toEqual([
      '2026-10',
      '2026-11',
    ]);
  });

  it('makes the future month available once it starts', () => {
    expect(buildReportableMonths([OCT_DEC], '2026-12-01')).toEqual([
      '2026-10',
      '2026-11',
      '2026-12',
    ]);
  });

  it('returns nothing when every enrolled month is still in the future', () => {
    const future = makeTerm('f', 'F', '2027-01-01', '2027-04-30');
    expect(buildReportableMonths([future], '2026-11-06')).toEqual([]);
  });

  it('keeps a month that has started, even on its first day', () => {
    expect(buildReportableMonths([OCT_DEC], '2026-10-01')).toEqual(['2026-10']);
  });
});
