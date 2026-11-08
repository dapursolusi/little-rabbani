# TypeScript Patterns

Stack-specific mechanics. Type-naming table, cast seams, comments, file-size rules live in the personal SSOT `stacks/typescript.md`.

## Types

- Type naming conventions:  
  - Module types:  

  |Name|Description|Location|
  |---|---|---|
  |`XxxRecord`|Derived from db schema entity/table, e.g. `type KidRecord = typeof kid.$inferSelect`|Module `types.ts`|
  |`XxxData`|Built for **backend**. Derived from `XxxRecord` with omitted audit fields, e.g. `type KidData = Omit<KidRecord, keyof DbTableAuditFields>`.|Module `types.ts`|
  |`Xxx`|Built for **frontend**. Default equal to `XxxData`, e.g. `type Kid = KidData`.|Module `types.ts`|
  |`XxxInsert`|Db insert for **backend**, usually repository. e.g. `type KidInsert = PickRequiredKeys<typeof kid.$inferInsert>`|Module `types.ts`|
  |`XxxWithRelations`|When the module have list feature which give nested data structure, prioritize the type derived from the list e.g. `type KidWithRelations = Awaited<ReturnType<typeof kidRepo.findMany>>`. Narrow the type more when necessary, e.g. `type GuardianWithRelations = KidWithRelations['guardian'][number]`.|Module `types.ts`|
  |`LeanXxx`|Default to basic info for an entity, e.g. `type LeanKid = Pick<Kid,'id'\|'name'\|'nickName'>`. Use only when there is a need or the type `Xxx` can be simplified to basic info, otherwise skip this.|Module `types.ts`|
  |`XxxInput`|Derived from the validation from **frontend**, e.g. `type KidInput = z.infer<typeof kidSchema>`|Module validation `validation.ts`|

  - Global types:

  |Name|Description|Location|
  |---|---|---|
  |`DbTableAuditFields`|<pre><code>interface DbTableAuditFields {<br>createdAt: Date;<br>updatedAt: Date;<br>deletedAt?: Date;<br>}</code></pre>|Project `types.ts`|
  |`PickRequiredKeys<T>`|<pre><code>type RequiredKeys<T> = {<br>  [K in keyof T as {} extends Pick<T, K> ? never : K]: T[K];<br>};</code></pre>|Project `types.ts`|

  - Notes:
  Other necessary types not listed above either module or project, follow the best practice or industry standard.
- `as const satisfies Record<...>` for typed constant objects (column selections, config maps) — `satisfies` checks without widening.

## Enum constants — named-map stack

Every domain enum constant might have 4-piece stack:

```ts
export const STATUS = {
  GENERATED: 'generated',
  SENT: 'sent',
} as const;
export type Status = (typeof STATUS)[keyof typeof STATUS];
export const STATUS_VALUES = Object.values(STATUS) as [Status, ...Status[]];
export const STATUS_LABELS: Record<Status, string> = {
  [STATUS.GENERATED]: '…',
  [STATUS.SENT]: '…',
};
```

- `NAME` (UPPER_SNAKE `as const`) → `Name` type via indexed lookup → `NAME_VALUES` (tuple cast, feeds `z.enum`/pgEnum) → `NAME_LABELS` (display map). Optional: `NAME_BADGE` → Tailwind classes. Values live in one place; schema, validation, and UI all read from it.
- For simple enum with no label/validation/UI is conditional on actual consumers.

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

## Validation

- One zod schema per module/entity, co-located in the feature (`validation.ts`), exporting `XxxSchema` + `type XxxInput = z.infer<...>`.
- Compose with base + `.extend` (Create/Update variants) — don't duplicate field lists.
- Shared primitives (`uuidSchema`, `isoDateSchema`, …) live in a common module; reuse before redefining.
- Enum schemas reference the constants VALUES (`z.enum(STATUS_VALUES)`), never inline literals.
- Parse at every trust boundary with one shared helper that returns the discriminated result directly — actions stay branch-free: `if (!parsed.success) return parsed`.
- One-off schemas may sit inline at the seam when used exactly once.

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
