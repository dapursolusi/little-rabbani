import { ActionResult } from '@/types';
import { z } from 'zod';

/**
 * Parse unknown input against a schema and return an ActionResult-shaped
 * result — so a failed parse can be returned straight from a Server Action
 * with no branching. Used at every action I/O boundary (see `actions.ts`).
 */
export function parseInput<S extends z.ZodType>({
  schema,
  input,
  fallbackError,
  withError = false,
}: {
  schema: S;
  input: unknown;
  fallbackError?: string;
  withError?: boolean;
}): ActionResult<z.output<S>> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join('.') || '_root';

    return {
      success: false,
      message: fallbackError ?? 'Data tidak valid',
      ...(withError && {
        error: {
          type: 'validation',
          fieldErrors: {
            [path]: [first.message],
          },
        },
      }),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
