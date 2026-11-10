import type { Term } from '@/features/term/types';
import { getLocalDateString } from '@/utils/date';

const DAY_MS = 86_400_000;
// ponytail: hard cap on month expansion — malformed dates can't spin forever.
const MAX_MONTHS = 1200;

type TermRange = Pick<Term, 'startDate' | 'endDate'>;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toUtcMs(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function monthStartDate(yearMonth: string) {
  return `${yearMonth}-01`;
}

export function monthEndDate(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

/** Every `YYYY-MM` touched by the date range, inclusive on both ends. */
export function monthKeysBetween(startDate: string, endDate: string): string[] {
  const [startYear, startMonth] = startDate.split('-').map(Number);
  const [endYear, endMonth] = endDate.split('-').map(Number);
  if (!startYear || !startMonth || !endYear || !endMonth) return [];

  const months: string[] = [];
  let year = startYear;
  let month = startMonth;
  while (
    (year < endYear || (year === endYear && month <= endMonth)) &&
    months.length < MAX_MONTHS
  ) {
    months.push(`${year}-${pad(month)}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

export function termOverlapsMonth(term: TermRange, yearMonth: string) {
  return (
    term.startDate <= monthEndDate(yearMonth) &&
    term.endDate >= monthStartDate(yearMonth)
  );
}

/** Chronological, de-duplicated months from the kid's enrolled terms. */
export function buildEligibleMonths(terms: TermRange[]): string[] {
  const months = new Set<string>();
  for (const term of terms) {
    for (const month of monthKeysBetween(term.startDate, term.endDate)) {
      months.add(month);
    }
  }
  return [...months].sort();
}

/**
 * Months that have already started — a future month has no data to report on
 * and must not be reachable, not even as a disabled option.
 */
export function buildReportableMonths(
  terms: TermRange[],
  today: string = getLocalDateString()
): string[] {
  const currentMonth = today.slice(0, 7);
  return buildEligibleMonths(terms).filter((month) => month <= currentMonth);
}

export function hasMonthStarted(
  yearMonth: string,
  today: string = getLocalDateString()
) {
  return yearMonth <= today.slice(0, 7);
}

export function termsOverlappingMonth(
  terms: Term[],
  yearMonth: string
): Term[] {
  return terms.filter((term) => termOverlapsMonth(term, yearMonth));
}

/** Days shared by the term and the calendar month — used only for tie-breaks. */
export function overlapDays(term: TermRange, yearMonth: string) {
  const start = Math.max(
    toUtcMs(term.startDate),
    toUtcMs(monthStartDate(yearMonth))
  );
  const end = Math.min(toUtcMs(term.endDate), toUtcMs(monthEndDate(yearMonth)));
  return end < start ? 0 : Math.round((end - start) / DAY_MS) + 1;
}

/**
 * Priority: requested term (only if eligible for the month) → ongoing term →
 * greatest month overlap → later start date.
 */
export function resolveTermForMonth({
  terms,
  yearMonth,
  requestedTermId,
  today = getLocalDateString(),
}: {
  terms: Term[];
  yearMonth: string;
  requestedTermId?: string;
  today?: string;
}): Term | null {
  if (terms.length === 0) return null;

  const requested = terms.find((term) => term.id === requestedTermId);
  if (requested) return requested;

  const ongoing = terms.find(
    (term) => term.startDate <= today && term.endDate >= today
  );
  if (ongoing) return ongoing;

  return [...terms].sort(
    (a, b) =>
      overlapDays(b, yearMonth) - overlapDays(a, yearMonth) ||
      b.startDate.localeCompare(a.startDate)
  )[0];
}

/** The term's final calendar month is the month containing its end date. */
export function isTermFinalMonth(term: TermRange, yearMonth: string) {
  return term.endDate.slice(0, 7) === yearMonth;
}

/**
 * The observation window shared by every kid in a term for one calendar month:
 * the month clipped to the term. Null when the term does not overlap the month.
 */
export function monthWindowInTerm(term: TermRange, yearMonth: string) {
  const monthStart = monthStartDate(yearMonth);
  const monthEnd = monthEndDate(yearMonth);
  const startDate = term.startDate > monthStart ? term.startDate : monthStart;
  const endDate = term.endDate < monthEnd ? term.endDate : monthEnd;
  if (startDate > endDate) return null;

  return {
    startDate,
    endDate,
    isFinalMonth: isTermFinalMonth(term, yearMonth),
  };
}
