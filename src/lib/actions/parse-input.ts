import { z } from 'zod';

/**
 * Parse unknown input against a schema and return an ActionResult-shaped
 * result — so a failed parse can be returned straight from a Server Action
 * with no branching. Used at every action I/O boundary (see `actions.ts`).
 */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
  fallbackError: string
): { success: true; data: z.infer<S> } | { success: false; error: string } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path?.length ? first.path.join('.') : null;
    const message = path ? `${path}: ${first.message}` : first.message;
    return {
      success: false as const,
      error: message || fallbackError,
    };
  }
  return { success: true as const, data: parsed.data };
}
