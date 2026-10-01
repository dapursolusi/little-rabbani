/** 7-day edit window for DCR data. Past this, records become read-only. */
export const EDIT_WINDOW_DAYS = 7;

/**
 * Check if a date string (YYYY-MM-DD) falls within the edit window.
 * Window = local-today - EDIT_WINDOW_DAYS through local-today.
 * Uses local timezone (Asia/Jakarta) so UTC+7 users see correct day boundaries.
 */
export function isWithinEditWindow(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const todayLocal = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const now = new Date(todayLocal + 'T23:59:59.999');
  const cutoff = new Date(todayLocal + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() - EDIT_WINDOW_DAYS);

  return date >= cutoff && date <= now;
}
