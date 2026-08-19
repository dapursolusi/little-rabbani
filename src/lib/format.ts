/**
 * Shared date formatting utilities.
 * Centralizes duplicated formatDate functions across the codebase.
 */

/**
 * Format a date string (YYYY-MM-DD) into Indonesian locale format
 * with day name prefix. e.g., "Senin, 1 Januari 2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    "Jum'at",
    'Sabtu',
  ];
  const dayName = days[date.getDay()];
  const formatted = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${dayName}, ${formatted}`;
}

/**
 * Age in Indonesian from a YYYY-MM-DD date of birth, e.g. "3 tahun 5 bulan".
 * Returns "-" for an invalid or future date.
 */
export function formatAge(dob: string): string {
  const birth = new Date(dob + 'T00:00:00');
  if (Number.isNaN(birth.getTime())) return '-';
  const now = new Date();
  if (birth > now) return '-';

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years > 0) return `${years} tahun ${rem} bulan`;
  return `${rem} bulan`;
}

/** Short Indonesian form: day name + short month, e.g. "Senin, 11 Agu". */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    "Jum'at",
    'Sabtu',
  ];
  const dayName = days[date.getDay()];
  const formatted = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
  return `${dayName}, ${formatted}`;
}
