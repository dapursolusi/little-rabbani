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
