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
