/** 7-day edit window for DCR data. Past this, records become read-only. */
export const EDIT_WINDOW_DAYS = 7;

/**
 * Check if a date string (YYYY-MM-DD) falls within the edit window.
 * Window = today - EDIT_WINDOW_DAYS through today.
 */
export function isWithinEditWindow(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - EDIT_WINDOW_DAYS);
  cutoff.setHours(0, 0, 0, 0);

  return date >= cutoff && date <= now;
}
