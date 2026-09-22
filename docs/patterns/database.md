# Database Patterns

## Stack

Drizzle ORM + Neon Postgres. WS `Pool` driver (`@neondatabase/serverless`) — required for transactions. `db` singleton at `src/db/index.ts`.

## Schema files

One file per entity under `src/db/schema/` (e.g. `auth.ts`, `kids.ts`, `enrollment.ts`). Exported from `src/db/schema/index.ts` via `export * from './<name>'`.

## Table definition pattern

```ts
export const entity = pgTable(
  'entity_name',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // ...columns...
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    // Indexes + constraints
  })
);
```

## Soft delete

Destructive actions set `deletedAt` instead of deleting rows. Reads filter `isNull(table.deletedAt)`. Unique indexes use WHERE clauses to enforce uniqueness only on live rows:

```ts
uniqueIndex('guardian_phone_unique_live')
  .on(table.phone)
  .where(sql`${table.deletedAt} is null`),
```

## FK referential actions

Use `onDelete: 'restrict'` on FKs where deletion should be blocked if child rows exist:

```ts
themeId: uuid('theme_id')
  .notNull()
  .references(() => theme.id, { onDelete: 'restrict' }),
```

This prevents deleting a parent that still has children. The DB error surfaces as a caught exception in the service layer.

## Index every FK by default

Postgres does not auto-index FK columns. Each FK gets a single-column index:

```ts
(table) => ({
  guardianIdx: index('kid_guardian_idx').on(table.guardianId),
  kidNameDobUnique: unique('kid_name_dob_unique').on(table.name, table.dob),
});
```

## Enum + label constants

pgEnum (or `as const` array) + parallel `*_LABELS` record mapping value → Indonesian display label:

```ts
export const GENDERS = ['male', 'female'] as const;
export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
};
```

Both exported from schema file, reused by form fields (select options) and table columns (cell renderers).

## Relations

Declared beside the table, not in a separate file:

```ts
export const kidRelations = relations(kid, ({ one, many }) => ({
  guardian: one(guardian, {
    fields: [kid.guardianId],
    references: [guardian.id],
  }),
  enrollments: many(kidEnrollment),
}));
```

## Repository layer

Under `features/<entity>/repositories/` as a directory. One file per DB table — a repository is scoped to a single table schema. Barrel `index.ts` re-exports with namespaced aliases:

```ts
// repositories/index.ts
export * as themeRepo from './theme';
export * as subThemeRepo from './sub-theme';
```

Each file exports standalone functions (not class methods). Takes optional `tx?: TransactionClient` for transactional operations:

```ts
export async function insert(data, tx?: TransactionClient) {
  const session = tx ? tx : db;
  const [inserted] = await session.insert(table).values(data).returning();
  return inserted;
}
```

## Transaction pattern

Cross-table writes use `db.transaction()`. The `TransactionClient` type at `src/types/index.ts` provides the typed transaction handle:

```ts
const result = await db.transaction(async (tx) => {
  // all operations on tx
});
```

## Migrations

After any schema change: `bun run db:generate` → `bun run db:migrate`. Verify with `drizzle-kit push --force`.

## Pool driver

`src/db/index.ts` uses `Pool` (WS) — not `neon-http`. The WS driver supports transactions.
