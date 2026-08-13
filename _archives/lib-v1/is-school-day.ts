import { holidayRangeOverlap } from '@/lib/holiday-range-overlap';

export interface TermInfo {
  startDate: string;
  endDate: string;
}

export function isSchoolDay(
  date: string,
  term: TermInfo,
  holidays: Array<{ startDate: string; endDate: string }>,
  hasActiveSessionType: boolean
): boolean {
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay();

  // Weekend
  if (day === 0 || day === 6) return false;

  // Out of term
  const termStart = new Date(term.startDate + 'T00:00:00');
  const termEnd = new Date(term.endDate + 'T00:00:00');
  if (d < termStart || d > termEnd) return false;

  // Holiday closure
  if (holidayRangeOverlap(date, holidays)) return false;

  // No active session type
  if (!hasActiveSessionType) return false;

  return true;
}
