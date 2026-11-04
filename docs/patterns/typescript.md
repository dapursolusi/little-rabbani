# TypeScript Patterns

## Discriminated-union results

Every Server Action / service returns a discriminated union — the single pattern for all I/O boundaries:

```ts
type ActionResult<T = void> =
  | { success: true; message?: string; data: T; error?: never }
  | { success: false; message: string; data?: never; error?: ActionError };
```

Declared in `src/types/index.ts`. Write literal arms with `as const` on the `success` field (`{ success: true as const, data }`) so TS narrows with `if (!result.success)`.

## `parseInput()` — zod at every trust boundary

```ts
parseInput({ schema, input, fallbackError?, withError? });
// → ActionResult<z.output<S>>
```

Returns an ActionResult directly from a failed zod parse. No branching needed in the action — just `if (!parsed.success) return parsed`. `withError: true` adds structured `fieldErrors` to the error object.

## Entity types pattern

Derived, never hand-rolled:

```ts
// types.ts
type KidRecord = typeof kid.$inferSelect;        // full row incl. audit fields
type KidData = Omit<KidRecord, keyof DbTableAuditFields>;  // minus audit triplet
type Kid = KidData;                               // public alias
type LeanKid = Pick<Kid, 'id' | 'name' | 'nickName'>;  // lean API shape
```

The `Record → Data → alias` rename chain is the idiom. Lean sub-types drive both column selections and API payloads.

## Validation file

Zod schemas live in `features/<entity>/validation.ts` (not `schemas.ts`):

```ts
export const XxxSchema = ...;
export type XxxInput = z.infer<typeof XxxSchema>;
```

- Base + `.extend` composition (`CreateXxxSchema = BaseXxxSchema`, `UpdateXxxSchema = BaseXxxSchema.extend({...})`).
- Enum schemas reference constants: `z.enum(NAME_VALUES)` — no inline literal arrays.
- Messages inline per field, Indonesian.
- Shared primitives in `src/lib/validation/common.schema.ts`: `uuidSchema`, `isoDateSchema`, `isoYearMonthSchema` (+ inferred `UUID`, `ISODate`, `ISOYearMonth` types). Reuse before redefining.
- One-off schemas may live inline at the action seam when used exactly once.

## Named-map constants

Every domain enum constant is a 4-piece stack in `features/<entity>/constants.ts`:

```ts
export const MONTHLY_REPORT_STATUS = {
  GENERATED: 'generated',
  EDITED: 'edited',
  SENT: 'sent',
} as const;
export type MonthlyReportStatus =
  (typeof MONTHLY_REPORT_STATUS)[keyof typeof MONTHLY_REPORT_STATUS];
export const MONTHLY_REPORT_STATUS_VALUES = Object.values(
  MONTHLY_REPORT_STATUS
) as [MonthlyReportStatus, ...MonthlyReportStatus[]];
export const MONTHLY_REPORT_STATUS_LABELS: Record<MonthlyReportStatus, string> = {
  [MONTHLY_REPORT_STATUS.GENERATED]: 'AI Generated',
  // ...
};
```

`NAME` (UPPER_SNAKE `as const`) → `Name` type via indexed lookup → `NAME_VALUES` (tuple cast for `z.enum`/pgEnum) → `NAME_LABELS` (Indonesian display map). Optional extras: `NAME_BADGE` (Record → Tailwind classes). Consumed by zod, pgEnum, and UI label lookups.

## Acronyms are words

Case identifiers as words: `Dcr`, `getDcrs`, `dcrObservationSchema` — not `DCR`, `getDCRs`. (Legacy `DCR*` names exist; see violations.md.)

## Props typing

- Default to `interface XxxProps { ... }`.
- Switch to `type` when the shape needs what interface can't express: unions, intersections, mapped/conditional types, `z.infer`-style derived types.
- Inline anonymous object types are acceptable only for trivial single-use props (≤3 props, e.g. page signatures `{ params: Promise<...> }`).

## Column selections

`as const satisfies` typed boolean selections:

```ts
export const omitAuditColumns = {
  createdAt: false, updatedAt: false, deletedAt: false,
} as const satisfies Record<keyof DbTableAuditFields, boolean>;

// per-entity lean selection, exported from the repo file:
export const leanKidColumnSelection = {
  id: true, name: true, nickName: true,
} as const satisfies Record<keyof LeanKid, boolean>;
```

## Repository exports

Repositories under `repositories/` dir with `index.ts`:

```ts
export * as kidRepo from './kid';
export * as guardianRepo from './guardian';
```

Single-entity modules use one flat `repositories.ts` consumed as `import * as kidRepo from './repositories'`.

## Module layer granularity

Flat by default — `actions.ts`, `services.ts`, `repositories.ts`. Split a layer to a directory + `index.ts` barrel (`export * as xRepo from './x'`) once it serves **2+ entities**.

## No `any`

Use `unknown` or proper types. Accepted cast seams (each marked with a comment):

- `as never` at the zodResolver ↔ react-hook-form seam (see forms.md).
- `tx as unknown as <NarrowTx>` at the transaction test seam (narrow-interface tx + fake-tx; see database.md).

## Ponytail comments

Known-simplification comments marked with `// ponytail:` explaining the tradeoff and upgrade path.

## Icon type

Hugeicons icons use `IconSvgElement` from `@hugeicons/react`. The `isIconSvgElement()` utility in `src/utils/icon-checker.ts` guards runtime type checks.

## `cn()` utility

```ts
import { cn } from '@/lib/utils';

// clsx + tailwind-merge
```

## Logging

Use `logger` from `src/lib/logger.ts` (pino, PII-redacting) — not `console.*` — in server code: `logger.error({ err: error }, 'fnName')`. (Older services still use `console.error`; see violations.md.)
