# Database Patterns

## Stack

Drizzle ORM + Neon Postgres. WS `Pool` driver (`@neondatabase/serverless`) — required for transactions. `db` singleton at `src/db/index.ts`.

## Schema files

One file per entity under `src/db/schema/` (e.g. `auth.ts`, `kids.ts`, `enrollment.ts`, `daily.ts`, `theme.ts`). Exported from `src/db/schema/index.ts` via `export * from './<name>'`.

## Table definition pattern

```ts
export const entity = pgTable(
  'entity_name',   // camelCase JS name, snake_case DB name
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // ...columns...
    ...auditColumns,
  },
  (table) => [
    // Array style — canonical (matches current Drizzle upstream direction).
    index('entity_fk_idx').on(table.fkId),
  ],
);
```

- **Third arg is array style** `(table) => [ ... ]` — object style `(table) => ({ ... })` is legacy in this repo; new tables use arrays.
- Audit triplet on every domain table: `createdAt` defaultNow, `updatedAt` defaultNow + `.$onUpdateFn(() => new Date())`, `deletedAt` nullable. Shared definition in `src/db/selections/audit-columns.ts`.
- Dates: business dates are `text` ISO strings (`date: text('date')`, `month: text('month')`) validated by `isoDateSchema` at the boundary; timestamps are `timestamp()`.
- Check constraints for value/date sanity (`check('check_date', sql`${table.startDate} < ${table.endDate}`)`).

## Enum constants ownership

The feature module owns the constants; the schema only declares the pgEnum:

```ts
// features/<entity>/constants.ts — the named-map stack (see typescript.md)
export const GENDER = { MALE: 'male', FEMALE: 'female' } as const;
export const GENDER_VALUES = Object.values(GENDER) as [...];

// src/db/schema/kids.ts — schema imports the VALUES
export const genderEnum = pgEnum('gender', GENDER_VALUES);
```

Labels (`*_LABELS`) also live in the feature constants file, consumed by form fields and table cells.

## Soft delete

Destructive actions set `deletedAt` instead of deleting rows. Reads filter `isNull(table.deletedAt)`. Unique indexes use WHERE clauses to enforce uniqueness only on live rows:

```ts
uniqueIndex('guardian_phone_unique_live')
  .on(table.phone)
  .where(sql`${table.deletedAt} is null`),
```

Hard `db.delete()` is reserved for rows with no audit value (never for domain entities — see violations.md).

## FK referential actions

Use `onDelete: 'restrict'` on FKs where deletion should be blocked if child rows exist; `'cascade'` where children are meaningless without the parent.

## Index every FK by default

Postgres does not auto-index FK columns. Each FK gets a single-column index:

```ts
(table) => [
  index('kid_guardian_idx').on(table.guardianId),
  unique('kid_name_dob_unique').on(table.name, table.dob),
];
```

- Single-column `index()` per FK as the baseline.
- Merge into a composite only when columns are _always_ filtered together.
- Drop an index only when `EXPLAIN ANALYZE` shows it never used — never pre-optimize; index by default, profile later.

## Relations

Declared beside the table, named `*Relations` (not `*Relationship`):

```ts
export const kidRelations = relations(kid, ({ one, many }) => ({
  guardian: one(guardian, {
    fields: [kid.guardianId],
    references: [guardian.id],
  }),
  enrollments: many(kidEnrollment),
}));
```

## Column selections

Default read selection omits audit columns via the shared helper:

```ts
// src/db/selections/audit-columns.ts
export const omitAuditColumns = { createdAt: false, updatedAt: false, deletedAt: false }
  as const satisfies Record<keyof DbTableAuditFields, boolean>;
```

Use as `columns: { ...omitAuditColumns }` in `db.query.*`. Per-entity lean selections (`leanKidColumnSelection`, `as const satisfies Record<keyof LeanKid, boolean>`) are exported from the repo file and may be imported cross-module.

## Drizzle query style

- **Reads:** relational API — `db.query.<table>.findMany/findFirst({ where, columns, with, orderBy })`.
- **Writes/aggregates:** core builder — `db.insert/update/select().from()`.
- `orderBy: (t, { desc }) => [desc(t.createdAt)]`.
- `where` composed as `and(...)` over an undefined-filtered array: `[...].filter((f) => f !== undefined)`.
- Count: `drizzleCount()` helper (typed), not raw `sql<number>`count(*)``.

## Repository layer

Flat `repositories.ts` for single-entity modules; directory + barrel once 2+ entities (see typescript.md → Module layer granularity). Directory files are scoped to one table each. Barrel re-exports with namespaced aliases:

```ts
// repositories/index.ts
export * as themeRepo from './theme';
export * as subThemeRepo from './sub-theme';
```

Each file exports standalone functions (not class methods), grouped by section comments in CRUD order — `// Find`, `// Insert`, `// Update`, `// Remove`. Names: `findMany`, `findById`, `insert`, `update`, `remove`, `count`, plus domain finds (`findByPhone`, `findOverlapping`). Repos return raw rows (`.returning()`) or throw — no ActionResult wrapping, no auth gating.

Optional-transaction parameter for transactional operations:

```ts
export async function insert(data, tx?: TransactionClient) {
  const session = tx ? tx : db;
  const [inserted] = await session.insert(table).values(data).returning();
  return inserted;
}
```

## Transaction pattern

Cross-table writes use `db.transaction()`. Services open the transaction and pass `tx` down to repos:

```ts
const result = await db.transaction(async (tx) => {
  const guardian = await guardianRepo.insert(guardianData, tx);
  return kidRepo.insert({ ...kidData, guardianId: guardian.id }, tx);
});
```

`TransactionClient` type is at `src/types/index.ts`. For unit-testing transactional logic, repos are typed against a narrow hand-written interface (`GuardianTx`) with an in-memory fake tx in `tests/helpers/fake-tx.ts` — see `kid/services.ts` for the seam idiom.

## Migrations

During active feature work, local schema syncing (`bun run db:push`) is fine — schema is free to edit until the feature works locally. At freeze, ship via `bun run db:generate` → `bun run db:migrate`: the migration chain is the source of truth for production schema state, never bypassed on shared/prod DBs.

## Pool driver

`src/db/index.ts` uses `Pool` (WS) — not `neon-http`. The WS driver supports transactions.
