# Patterns — living extraction of the implemented code

Split into per-stack files. Code wins if doc disagrees — update doc in same change.

| Stack                      | File                                    |
| -------------------------- | --------------------------------------- |
| Next.js / App Router       | [nextjs.md](patterns/nextjs.md)         |
| TypeScript                 | [typescript.md](patterns/typescript.md) |
| Database (Drizzle + Neon)  | [database.md](patterns/database.md)     |
| Forms (FormFieldGenerator) | [forms.md](patterns/forms.md)           |
| DataTable (TanStack v9)    | [tables.md](patterns/tables.md)         |
| Auth (Better Auth)         | [auth.md](patterns/auth.md)             |
| Shared UI                  | [shared-ui.md](patterns/shared-ui.md)   |

Extract a new pattern only after a repeatable shape lands. Promote to AGENTS.md only after 3+ entities use it unchanged. Add a new stack file when patterns grow too large.

## Settled hard rules (locked here, not in stack files)

These are decisions, not in-flux patterns — they live in AGENTS.md:

- **Generic form engine:** the shared renderer is `FormFieldGenerator`
  (`src/components/shared/form/form-field-generator.tsx`) + `InputFieldRenderer`.
  It takes a Zod schema, `initialData`, and a `FormField[]` from the entity's
  `form-fields.ts` (`src/types/field.ts`). Grouping is done by `{ groupLabel }`
  headers in the field list → `<FieldSet>` sections. Zod resolver is
  `zodResolver(schema) as never` — one cast at the `zodResolver` ↔
  react-hook-form seam, accepted because zod v4's `$ZodType` variance makes
  generic passthrough unworkable across 3 library seams. Tradeoff: ~1 cast in a
  shared component vs. per-entity form components. Upgrade to per-entity
  components when `onSubmit` needs compile-time verification against a
  server-action param schema. See ADR-0003.
- **`src/components/ui/` is auto-generated** (shadcn base-nova) — never edited
  by hand. Brand customization happens via tokens in `globals.css` or
  per-call classNames.
- **Discriminated-union action results** (`{ success: true, data } | { success:
false, error }` with `as const`) — clients narrow with `if (!result.success)`.
  `parseInput()` produces one directly from a failed zod parse.
- **Index every FK column by default** in Drizzle. Postgres does not
  auto-index FK columns, so any WHERE/JOIN on an unindexed FK is a full
  `Seq Scan`. Current example: `kid.guardianId` → `kid_guardian_idx`. Rule:
  - Single-column `index()` per FK as the baseline.
  - Merge into a composite only when columns are _always_ filtered together.
  - Drop an index only when `EXPLAIN ANALYZE` shows it never used — never
    pre-optimize; index by default, profile later.
  - Indexes live in the `pgTable` third-arg config callback, e.g.
    `(table) => ({ guardianIdx: index('kid_guardian_idx').on(table.guardianId) })`.
