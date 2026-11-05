# TypeScript Patterns

Stack-specific mechanics. Type-naming table, cast seams, comments, file-size rules live in the personal SSOT `stacks/typescript.md`.

## Discriminated-union results

Exact contract — `ActionResult<T>` declared in `src/types/index.ts`:

```ts
type ActionResult<T = void> =
  | { success: true; message?: string; data: T; error?: never }
  | { success: false; message: string; data?: never; error?: ActionError };
```

Failure field is **`message`**; `error` is an optional structured object (`validation | not_found | conflict | internal`).

## `parseInput()` — zod at every trust boundary

```ts
parseInput({ schema, input, fallbackError?, withError? });
// → ActionResult<z.output<S>>
```

Returns an ActionResult directly from a failed zod parse — `if (!parsed.success) return parsed`. `withError: true` adds structured `fieldErrors`.

## Validation file

Zod schemas live in `features/<entity>/validation.ts` (not `schemas.ts`):

- Base + `.extend` composition (`CreateXxxSchema = BaseXxxSchema`, `UpdateXxxSchema = BaseXxxSchema.extend({...})`).
- Enum schemas reference constants: `z.enum(NAME_VALUES)` — no inline literal arrays.
- Messages inline per field, Indonesian.
- Shared primitives in `src/lib/validation/common.schema.ts`: `uuidSchema`, `isoDateSchema`, `isoYearMonthSchema` (+ inferred `UUID`, `ISODate`, `ISOYearMonth`). Reuse before redefining.
- One-off schemas may live inline at the action seam when used exactly once.

## Column selections

```ts
export const omitAuditColumns = {
  createdAt: false,
  updatedAt: false,
  deletedAt: false,
} as const satisfies Record<keyof DbTableAuditFields, boolean>;

// per-entity lean selection, exported from the repo file:
export const leanKidColumnSelection = {
  id: true,
  name: true,
  nickName: true,
} as const satisfies Record<keyof LeanKid, boolean>;
```

## Repository exports

Repositories under `repositories/` dir with `index.ts`:

```ts
export * as kidRepo from './kid';
export * as guardianRepo from './guardian';
```

Single-entity modules use one flat `repositories.ts` consumed as `import * as kidRepo from './repositories'`.

## Icon type

Hugeicons icons use `IconSvgElement` from `@hugeicons/react`. The `isIconSvgElement()` utility in `src/utils/icon-checker.ts` guards runtime type checks.

## Logging

Use `logger` from `src/lib/logger.ts` (pino, PII-redacting) — not `console.*` — in server code: `logger.error({ err: error }, 'fnName')`. (Older services still use `console.error`; see violations.md.)
