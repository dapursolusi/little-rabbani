/**
 * Mechanical text cleanup: trim, capitalize first letter, ensure trailing period.
 * If null/undefined, returns empty string.
 */
export function cleanseText(text: string | null | undefined): string {
  if (!text) return '';
  let cleaned = text.trim();
  if (!cleaned) return '';
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const last = cleaned[cleaned.length - 1];
  if (last !== '.' && last !== '!' && last !== '?') {
    cleaned += '.';
  }
  return cleaned;
}
