const DEFAULT_TIMEZONE = 'Asia/Jakarta';

/**
 * Return today's date as YYYY-MM-DD in the given timezone.
 * Defaults to Asia/Jakarta (WIB, UTC+7) — Indonesia preschool.
 */
export function getLocalDateString(timeZone = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
