# Database Patterns (Drizzle + Neon)

Stack-specific mechanics. Principles (layering, soft delete, FK indexing, migrations philosophy) live in the personal SSOT `stacks/database.md` — read it first.

## Stack

Drizzle ORM + Neon Postgres. WS `Pool` driver (`@neondatabase/serverless`) — required for transactions. `db` singleton at `src/db/index.ts`.

## Schema files

One file per domain under `src/db/schema/` (e.g. `auth.ts`, `kids.ts`, `enrollment.ts`, `daily.ts`, `theme.ts`). Exported from `src/db/schema/index.ts` via `export * from './<name>'`.

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
- Audit triplet shared definition in `src/db/selections/audit-columns.ts`.
- Business dates: `text('date')` ISO strings validated by `isoDateSchema`; timestamps `timestamp()`.
- Check constraints: `check('check_date', sql`${table.startDate} < ${table.endDate}`)`.

## Enum constants ownership

The feature module owns the constants; the schema only declares the pgEnum:

```ts
// features/<entity>/constants.ts — the named-map stack (see typescript.md)
export const GENDER = { MALE: 'male', FEMALE: 'female' } as const;

// src/db/schema/kids.ts — schema imports the VALUES
export const genderEnum = pgEnum('gender', GENDER_VALUES);
```

## Soft delete

Unique indexes partial on live rows:

```ts
uniqueIndex('guardian_phone_unique_live')
  .on(table.phone)
  .where(sql`${table.deletedAt} is null`),
```

Hard `db.delete()` is reserved for rows with no audit value (never for domain entities — see violations.md).

## Relations

Declared beside the table, named `*Relations` (not `*Relationship`):

```ts
export const kidRelations = relations(kid, ({ one, many }) => ({
  guardian: one(guardian, { fields: [kid.guardianId], references: [guardian.id] }),
  enrollments: many(kidEnrollment),
}));
```

## Column selections

```ts
// src/db/selections/audit-columns.ts
export const omitAuditColumns = { createdAt: false, updatedAt: false, deletedAt: false }
  as const satisfies Record<keyof DbTableAuditFields, boolean>;
```

Use as `columns: { ...omitAuditColumns }` in `db.query.*`. Per-entity lean selections (`leanKidColumnSelection`) exported from the repo file.

## Drizzle query style

- **Reads:** relational API — `db.query.<table>.findMany/findFirst({ where, columns, with, orderBy })`.
- **Writes/aggregates:** core builder — `db.insert/update/select().from()`.
- `orderBy: (t, { desc }) => [desc(t.createdAt)]`.
- Count: `drizzleCount()` helper (typed), not raw `sql<number>`count(*)``.

## Repository layer

Flat `repositories.ts` for single-entity modules; directory + barrel once 2+ entities. Barrel re-exports namespaced:

```ts
// repositories/index.ts
export * as themeRepo from './theme';
```

Each file exports standalone functions grouped `// Find` / `// Insert` / `// Update` / `// Remove`. Names: `findMany`, `findById`, `insert`, `update`, `remove`, `count`, plus domain finds. Repos return raw rows (`.returning()`) or throw — no ActionResult wrapping, no auth gating.

Optional-transaction parameter:

```ts
export async function insert(data, tx?: TransactionClient) {
  const session = tx ? tx : db;
  const [inserted] = await session.insert(table).values(data).returning();
  return inserted;
}
```

`TransactionClient` type is at `src/types/index.ts`. Unit-test seam: repos typed against a narrow hand-written interface (`GuardianTx`) with in-memory fake tx in `tests/helpers/fake-tx.ts` — see `kid/services.ts`.

## Migrations

`bun run db:generate` → `bun run db:migrate` (`--env-file=.env.local`). During active feature work `bun run db:push` is fine locally. Never bypass the chain on shared/prod DBs.