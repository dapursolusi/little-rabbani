import { addDays, format } from 'date-fns';

import { isSchoolDay } from '@/lib/is-school-day';

export function listTermWorkdays(
  term: { startDate: string; endDate: string },
  holidays: Array<{ startDate: string; endDate: string }>,
  hasActiveSessionType: boolean
): string[] {
  const workdays: string[] = [];
  const start = new Date(term.startDate + 'T00:00:00');
  const end = new Date(term.endDate + 'T00:00:00');

  for (let d = start; d <= end; d = addDays(d, 1)) {
    const iso = format(d, 'yyyy-MM-dd');
    if (isSchoolDay(iso, term, holidays, hasActiveSessionType)) {
      workdays.push(iso);
    }
  }

  return workdays;
}

export function countEmptyWorkdays(
  term: { startDate: string; endDate: string },
  holidays: Array<{ startDate: string; endDate: string }>,
  hasActiveSessionType: boolean,
  filledCount: number
): number {
  const workdayCount = listTermWorkdays(
    term,
    holidays,
    hasActiveSessionType
  ).length;
  return Math.max(0, workdayCount - filledCount);
}

export interface TermCoverage {
  startDate: string;
  endDate: string;
  deletedAt: Date | null;
}

export function findEarliestTermCoveringDate<T extends TermCoverage>(
  terms: T[],
  date: string
): T | null {
  const covering = terms
    .filter((t) => !t.deletedAt && t.startDate <= date && date <= t.endDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return covering[0] ?? null;
}
