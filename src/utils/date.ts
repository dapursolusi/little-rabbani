/** 7-day edit window for DCR data. Past this, records become read-only. */
export const EDIT_WINDOW_DAYS = 7;

/**
 * Check if a date string (YYYY-MM-DD) falls within the edit window.
 * Window = local-today - EDIT_WINDOW_DAYS through local-today.
 * Uses local timezone (Asia/Jakarta) so UTC+7 users see correct day boundaries.
 */
export function isWithinEditWindow(
  dateStr: string,
  {
    now = new Date(),
    editWindowDays = EDIT_WINDOW_DAYS,
  }: {
    now?: Date;
    editWindowDays?: number;
  } = {}
): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const todayLocal = getLocalDateString({ now });

  const nowEnd = new Date(todayLocal + 'T23:59:59.999');
  const cutoff = new Date(todayLocal + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() - editWindowDays);

  return date >= cutoff && date <= nowEnd;
}

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

/**
 * Return today's date as YYYY-MM-DD in the given timezone.
 * Defaults to Asia/Jakarta (WIB, UTC+7) — Indonesia preschool.
 */
export function getLocalDateString({
  timeZone = DEFAULT_TIMEZONE,
  now = new Date(),
}: {
  timeZone?: string;
  now?: Date;
} = {}): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function startOfNextMonthDate(yearMonth: string) {
  const nextMonth = new Date(`${yearMonth}-01T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  return nextMonth.toISOString().slice(0, 10);
}
