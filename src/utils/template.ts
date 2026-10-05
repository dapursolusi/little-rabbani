import { cleanseText } from './text';

/**
 * Data available for template expansion.
 * Keys map to {{placeholders}} in the template string.
 */
export type TemplateData = Record<string, string | null | undefined>;

/**
 * Expand a template string with data.
 *
 * - `{{placeholder}}` → replaced with the value (or empty string if null/undefined)
 * - `{{#if name}}...{{/if}}` — conditionally includes the block if `name` is non-empty
 * - `cleanseText` is applied to `description` and `notes` before substitution
 *
 * Pure function — no side effects, no DB calls. Test seam #1.
 */
export function renderTemplate(template: string, data: TemplateData): string {
  // Pre-cleanse description and notes
  const cleaned = { ...data };
  if (cleaned.description) {
    cleaned.description = cleanseText(cleaned.description);
  }
  if (cleaned.notes) {
    cleaned.notes = cleanseText(cleaned.notes);
  }

  // Process conditionals first: {{#if name}}...{{/if}}
  let result = template.replace(
    /\{\{#if (\w+)}}([\s\S]*?)\{\{\/if}}/g,
    (_match, key: string, block: string) => {
      const val = cleaned[key];
      return val && String(val).trim().length > 0 ? block : '';
    }
  );

  // Replace all {{placeholders}}
  result = result.replace(/\{\{(\w+)}}/g, (_match, key: string) => {
    const val = cleaned[key];
    return val != null ? String(val) : '';
  });

  return result;
}
