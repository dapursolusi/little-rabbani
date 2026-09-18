<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Context

> **Phase:** Active dev — V2 rebuild (kid module shipped)
> **Team size:** Solo
> **Primary users:** Preschool owner-operator (Hanifah)

Little Rabbani Preschool LMS — a back-office tool for a small Indonesian
preschool. The v1 app (observation/report domain) was archived to `_archives/`
and the app rebuilt from the auth shell; only the kid/guardian module is
implemented so far. Domain vocabulary lives in `CONTEXT.md`, the V2 plan in
`docs/superpowers/plans/kid-module-v2.md`. Treat `_archives/` as read-only
reference — it is the old v1, not live code.

## Stack

- **Runtime:** bun 1.3.13 (`@types/node` matches local runtime via bun itself)
- **Package manager:** bun (never npm/pnpm/yarn — `bun run`, `bunx`, `bun add`)
- **Styling:** Tailwind CSS 4 (CSS-first — no `tailwind.config.ts`) + shadcn/ui (style: base-nova, primitives: `@base-ui/react`, icons: `hugeicons`)
- **Architecture:** Next.js App Router. Server Components by default. `"use client"` only when hooks/event handlers are needed.
- **Key libs:** zod for all I/O boundaries (`env.mjs`). sonner for toasts. CVA + clsx for component variants. `@tanstack/react-table` v9 for DataTable.
- **Testing:** Vitest (unit, native `tsconfigPaths` resolution). Playwright for E2E.
- **Data layer:** Drizzle ORM + Neon Postgres (`@neondatabase/serverless`, WS `Pool` driver — required for transactions). Schema in `src/db/schema/`, one file per entity, exported from `src/db/schema/index.ts`. `db` singleton at `src/db/index.ts`. DB scripts (`db:generate`/`db:push`/`db:migrate`) use `--env-file=.env.local`.
- **Auth:** Better Auth (better-auth + `@better-auth/drizzle-adapter`), Google OAuth + dev-session bypass. Session gate via `requireOwner()` in `src/lib/actions/require-owner.ts`. Roles: `owner` | `teacher`.

## Architecture

```
UI Component (Server Component / Client form) → Server Action → Drizzle → Neon
```

- **API:** Server Actions only. No `api/` routes except Better Auth's `api/auth/[...all]` and the dev-session helper. Auth traffic routes via `src/proxy.ts` (session + role-based route guard).
- **Data flow:** Server Components fetch directly via `db.query.*`. Mutations are Server Actions returning a **discriminated-union result** (`{ success: true, data } | { success: false, error }`, `as const`) so client forms narrow with `if (!result.success)`.
- **Action I/O:** every Server Action parses `unknown` input with `parseInput()` (zod) and wraps itself in `requireOwner()` (the single auth gate). Both live in `src/lib/actions/`.
- **Feature verticals:** entity code under `src/features/<entity>/` (`actions.ts`, `schemas.ts`, `form-fields.ts`, `components/`, `types.ts`). Shared UI under `src/components/shared/`.
- **File placement:** All source code under `src/`. `@/*` maps to `./src/*`.

## Modules

- **kid** (`src/features/kids/`) — the only implemented domain vertical. Combined kid+guardian form (ADR-0001), identity-only kid (ADR-0002), real Drizzle CRUD with transactional inserts in `createKid`/`updateKid` (see ADR-0003). Routes: `/dashboard/kid`, `/dashboard/kid/create`, `/dashboard/kid/[id]/edit`.
- **auth** (`src/db/schema/auth.ts`, `src/lib/auth.ts`) — Better Auth tables (user, session, account, verification). `role` on user: `owner` gates all mutations via `requireOwner`.

## Rules

1. Responsive design is non-negotiable, shadcn already support this. Focus on mobile and desktop.
2. Must use shadcn components at all times. Prefer components from custom registries first then the standard shadcn.
3. Toast feedback (sonner) required on all user-facing mutations.
4. Check `env.mjs` before adding env vars. Add only when needed — don't pre-add "just in case".
5. Every page must export a `metadata` object. Use `baseMetadata` from `@/lib/metadata`.

## Forbidden

- ❌ NO `npm run` / `npx` — use `bun run` / `bunx`
- ❌ NO `any` types — use `unknown` or a proper interface
- ❌ NO `console.log` in production code — use `console.warn`/`console.error` only
- ❌ NO refactoring working legacy code unless told to
- ❌ NO `@apply` in CSS — Tailwind v4 doesn't support it
- ❌ NO editing `src/components/ui/` — shadcn base-nova components are auto-generated

## Naming Conventions

| Entity           | Convention  | Example           |
| :--------------- | :---------- | :---------------- |
| Components       | PascalCase  | `UserProfile.tsx` |
| Utilities        | camelCase   | `formatDate.ts`   |
| Functions        | camelCase   | `getUserById()`   |
| Props interfaces | PascalCase  | `ButtonProps`     |
| Types            | PascalCase  | `ComponentProps`  |
| Constants        | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| File names       | kebab-case  | `api-endpoint.ts` |
| Folder names     | kebab-case  | `class-session`   |

## File Placement

| Component Type                          | Location                                | Notes                                     |
| :-------------------------------------- | :-------------------------------------- | :---------------------------------------- |
| Page/Layout                             | `src/app/`                              | App Router conventions                    |
| Feature sections                        | `src/features/<module>/components/`     | Per-module components                     |
| Layout components                       | `src/components/layout/`                | Header, Footer, MobileMenu                |
| Shared UI primitives                    | `src/components/ui/`                    | shadcn base-nova (auto-generated)         |
| Utilities & constants                   | `src/lib/`                              | 3rd party, all that affecting domain      |
| Helpers                                 | `src/utils/`                            | helpers                                   |
| Types                                   | `src/types/`                            | Add per-project as needed                 |
| Tests (unit)                            | `src/features/_tests_/`                 | Vitest                                    |
| Tests (integration, within 1 module)    | `src/features/_tests_/`                 | Vitest                                    |
| Tests (integration, cross module)       | `tests/`                                | Vitest                                    |
| Tests (E2E)                             | `e2e/`                                  | Playwright                                |
| Server Actions                          | `src/features/<module>/actions.ts`      | Controllers/Actions                       |
| Services                                | `src/features/<module>/services.ts`     | Business Logic                            |
| Repositories                            | `src/features/<module>/repositories.ts` | Repositories                              |
| Repositories (Module w/ cross entities) | `src/features/<module>/repositories/`   | Repositories: file barrel`index.ts` and `<table/entity_name>.ts` |

## Commands

Standard scripts (`dev`, `build`, `lint`, `format`, `typecheck`, `test*`) live in `package.json`. Only the invocations that aren't discoverable from there:

```bash
bunx shadcn@latest add <component>   # Add base-nova component (NOT in package.json)
bunx playwright install              # First-time browser binary setup
```

## Graphify & CodeGraph

This project uses both graphify and CodeGraph for code intelligence. See `docs/patterns/graphify-codegraph.md` for usage and reindexing.

## Gotchas

- ⚠️ **React Compiler is ON** (`reactCompiler: true` in next.config, React 19). Auto-memoizes everything. Stable-identity trap: TanStack Table's `table` instance returns same object identity every render → compiler memoizes getter calls stale. **Fix:** mirror state into `useState`, derive UI values from that. `"use no memo"` escapes one component.
- ⚠️ See `docs/known-issues.md` for CI/env/ESLint/DB migration gotchas.

## When to Ask

- If stuck after **2 attempts** → log blockers and ask.
- Any decision that adds a new npm package or changes the data layer.
- Any decision that changes how env vars are managed or validated.
- Anything irreversible against the live Neon DB (migrations, drops) or a production deploy.

## References

- Backlog: GitHub Issues in `narasena/little-rabbani`
- Agent protocols: `CLAUDE.md`, UI: `DESIGN.md`, Domain vocab: `CONTEXT.md`, Patterns: `docs/patterns/`, Known issues: `docs/known-issues.md`
- Runbooks: `docs/runbooks/incident-response.md`, Deploy: [Vercel dashboard](https://vercel.com/narasena/little-rabbani)
- ADRs: `docs/adr/` (0001 kid+guardian form, 0002 identity-only kid, 0003 form engine)
- PII handling: `src/lib/pii.ts` (`detectPiiField`/`maskPiiFields`/`maskPiiValue`)
- Env: `env.mjs` (all vars registered here)

## Code Patterns

`docs/patterns.md` is the index. Follow `docs/patterns/` for new code. Code wins if doc disagrees.

**Extract new pattern** after repeatable shape lands. Promote to AGENTS.md only after 3+ entities use it unchanged.

### Settled hard rules (locked here)

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

## Doc Compression

Agent-only .md files compressed before commit. Rules in `docs/patterns/doc-compression.md`. Manual compression only — `caveman-compress` corrupts files.

## Agent skills

## Subagent Driven Development (locked rule)

**When calling the Agent tool for any code task, always pass `subagent_type` — never omit it.** The default `general-purpose` is reserved for non-code tasks only (architecture questions, research, multi-step non-code work).

| Task                                           | `subagent_type`         |
| ---------------------------------------------- | ----------------------- |
| Code search / discovery / "where is X"         | `cavecrew-investigator` |
| Edit (≤2 files, scope known)                   | `cavecrew-builder`      |
| Diff/branch/file review for bugs               | `cavecrew-reviewer`     |
| Everything else (research, planning, non-code) | `general-purpose`       |

### Issue tracker

Issues live as GitHub issues in `narasena/little-rabbani` via the `gh` CLI. External PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, each role's string equals its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

---

> **Make every line count — or delete it.**
