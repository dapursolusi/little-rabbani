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

| Component Type        | Location                            | Notes                             |
| :-------------------- | :---------------------------------- | :-------------------------------- |
| Page/Layout           | `src/app/`                          | App Router conventions            |
| Feature sections      | `src/features/<entity>/components/` | Per-module components             |
| Layout components     | `src/components/layout/`            | Header, Footer, MobileMenu        |
| Shared UI primitives  | `src/components/ui/`                | shadcn base-nova (auto-generated) |
| Utilities & constants | `src/lib/`                          | metadata, security-headers, utils |
| Types                 | `src/types/`                        | Add per-project as needed         |
| Tests (unit)          | `tests/`                            | Vitest                            |
| Tests (E2E)           | `e2e/`                              | Playwright                        |

## Commands

Standard scripts (`dev`, `build`, `lint`, `format`, `typecheck`, `test*`) live in `package.json`. Only the invocations that aren't discoverable from there:

```bash
bunx shadcn@latest add <component>   # Add base-nova component (NOT in package.json)
bunx playwright install              # First-time browser binary setup
```

## Graphify

This project has a knowledge graph at `graphify-out/` with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output.
- If `graphify-out/wiki/index.md` exists, use it for broad navigation instead of raw source browsing.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## CodeGraph

This project uses CodeGraph (`.codegraph/`) for code intelligence. Agents must ensure it's available before performing code exploration.

```bash
# 1. Check installation
which codegraph || echo "codegraph not installed"

# Install via pip:
# pip install codegraph

# 2. Check if index exists
ls .codegraph/codegraph.db 2>/dev/null && echo "indexed" || echo "not indexed"

# 3. Init if missing
codegraph init
```

**Agent auto-setup:** Before any code exploration or edit, silently run:

1. `which codegraph` — if missing, suggest install and stop
2. `ls .codegraph/codegraph.db 2>/dev/null` — if missing, run `codegraph init`

This is a one-time setup per clone. Skip if already indexed.

## Gotchas

- ⚠️ Vitest uses native `resolve.tsconfigPaths` — reads `tsconfig.json` paths automatically, no plugin needed.
- ⚠️ Tailwind v4 uses CSS-first config (`globals.css`). No `tailwind.config.ts`. Use `@theme inline` for custom values.
- ⚠️ shadcn preset `bI9A` pins style, base color, icon library, and primitives in one shot — no separate flags needed.
- ⚠️ `env.mjs` uses `@t3-oss/env-nextjs` — all env vars MUST be registered there, not read directly from `process.env`.
- ⚠️ Port 3000 must be free. Kill stale Next.js procs first.
- ⚠️ **React Compiler is ON** (`reactCompiler: true` in `next.config`, React 19). It auto-memoizes every component and sub-expression, treating a referentially-stable value as a **constant**. This breaks any library that keeps live, mutable state behind a stable handle — most importantly **TanStack Table's `table` instance**: `useReactTable` returns the _same object identity_ every render, so the compiler memoizes `table.getState()…` / `table.getCanNextPage()` reads and serves **stale values** even though the underlying state updated.
  - **Symptom:** UI shows stale value while imperative read in render body shows fresh — React Compiler memoized the getter.
  - **Fix:** mirror state into React `useState`, derive UI values from that, not from the stable handle. For TanStack Table: `state: { pagination }` + `onPaginationChange: setPagination` → derive `pageCount`/`canPreviousPage`/`canNextPage` from `pagination` state. Mutations still call `table.nextPage()`.
  - **Escape hatch:** `"use no memo"` directive opts one component out.
  - **Generalized:** any stale-read bug under `reactCompiler: true` → check if value comes from a stable handle hiding mutable state (zustand stores, TanStack Query refs, singleton services).
- ⚠️ **TypeScript `^6` resolution in CI** — `^6` in `package.json` can resolve to TypeScript 7.x (e.g. `7.0.2`) in CI, but `@typescript-eslint/typescript-estree@8.x` doesn't support TypeScript 7's new `Extension` enum. Linter crashes with `TypeError: Cannot read properties of undefined (reading 'Cjs')`. **Pin to an exact version** (`"typescript": "6.0.3"`) instead of a range — don't use `^`.
- ⚠️ **ESLint 10 + eslint-plugin-react 7.x incompatibility** — ESLint 10 removed `context.getFilename()`, but `eslint-plugin-react@7.x` still calls it in `lib/util/version.js`. Linter crashes on `.tsx` files with `TypeError: contextOrFilename.getFilename is not a function`. **Fix:** a postinstall patch (`scripts/patch-eslint-plugin-react.mjs`) replaces `contextOrFilename.getFilename()` → `contextOrFilename.filename`. Remove the patch when eslint-plugin-react ships 8.x.
- ⚠️ **`env.mjs` env vars required in CI** — `@t3-oss/env-nextjs` validates ALL env vars at import time. Tests importing `@/lib/auth` (which imports `env.mjs`) must set every variable in `beforeEach`, including `OPENROUTER_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`. CI workflows running `next dev` (E2E, Preview) need a full `.env` or injected secrets — missing vars crash startup.
- ⚠️ **DB schema changes require a migration, every time** — the Drizzle schema file and the live DB drift silently if you only edit `.ts`. After ANY schema change:
  1. `bun run db:generate` — produces migration SQL + snapshot
  2. `bun run db:migrate` — applies it to the DB
  3. Verify with `drizzle-kit push --force` (non-interactive) or run the schema audit script
  4. A 500 error on a relation query (`with: { ... }`) often means a column referenced in the schema doesn't exist in the DB
- ⚠️ **CodeGraph / graphify indexes go stale after refactors** — both are snapshot indexes. After a big restructure (like the v1→V2 teardown) they can answer with paths that no longer exist (e.g. `_archives/...`). Reindex explicitly:
  - `codegraph index` (full rebuild) or `codegraph sync` (incremental)
  - `graphify update . --force` (the `--force` is required when a refactor deleted code — the graph has fewer nodes and refuses to overwrite otherwise)
  - When an answer cites a path that doesn't exist, treat the index as stale before trusting the answer.

## When to Ask

- If stuck after **2 attempts** → log blockers and ask.
- Any decision that adds a new npm package or changes the data layer.
- Any decision that changes how env vars are managed or validated.
- Anything irreversible against the live Neon DB (migrations, drops) or a production deploy.

## References

- Backlog: GitHub Issues in `narasena/little-rabbani`
- Agent protocols: `CLAUDE.md`, UI: `DESIGN.md`, Domain vocab: `CONTEXT.md`, Patterns: `docs/patterns.md`, Known issues: `docs/known-issues.md`
- Runbooks: `docs/runbooks/incident-response.md`, Deploy: [Vercel dashboard](https://vercel.com/narasena/little-rabbani)
- ADRs: `docs/adr/` (0001 kid+guardian form, 0002 identity-only kid, 0003 form engine)
- PII handling: `src/lib/pii.ts` (`detectPiiField`/`maskPiiFields`/`maskPiiValue`)
- Env: `env.mjs` (all vars registered here)

## Code Patterns

`docs/patterns.md` is the **living extraction** of the patterns actually
implemented so far — follow it for new and refactored code.

**Why living doc, not locked rules:** only the kid vertical is implemented — locking freezes half-built shape. Premature hardening is the failure mode.

**Follow:** `docs/patterns.md`. Code wins if doc disagrees — update doc in same change.

**Extract new pattern** after repeatable shape lands. Capture in `patterns.md` first; promote to AGENTS.md only after 3+ entities use it unchanged.

**Split `patterns.md`** into per-stack files when it grows too large or domains feel jarring mixed. Keep one-line index in `patterns.md`.

### Settled hard rules (locked here, not in `patterns.md`)

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

Adding a new form: write `schemas.ts` (+ `form-fields.ts` + `types.ts`) under
`src/features/<entity>/`, then pass `schema`, `initialData`, `formFields` to
`FormFieldGenerator` in the entity's `*-form.tsx` (see
`src/features/kids/components/kid-form.tsx`).

Upgrade to per-entity components when `onSubmit` needs compile-time verification against a server-action param schema.

## Doc Compression Rules

Agent-only docs (.md files consumed only by agents, not humans) are compressed before commit. These rules govern when and how.

1. **`caveman-compress` never used in active sessions** — the skill corrupts files (injects meta-commentary, truncates content, breaks backups). Use only in isolated runs over non-live data. Manual compression always preferred.

2. **Compress agent-only .md before commit** — patterns, ADRs (after review), audit reports, agent-readiness checklists, generated route/component docs. Target 40–60% reduction for heavy files, 20–30% for moderate ones.

3. **Never compress** — behavioral protocol (CLAUDE.md S1–S8 rules), vocabulary glossaries (CONTEXT.md Language section), ADRs (reasoning is load-bearing), public-facing docs (PRD.md, manuals). Also: never when compression removes the "why" behind a rule.

4. **Verify cross-references after compression** — every inline link (`See AGENTS.md`, `docs/...`, `[[memory-link]]`) must still resolve. Run `grep -oP 'docs/[a-z/-]+\.md' <file>` and check each path exists.

5. **Subagents self-compress their output** — any subagent generating specs, plans, or audit reports (`docs/superpowers/specs/`, `docs/superpowers/plans/`) writes compressed from the start. Pass the instruction in the spawn prompt, don't rely on a later pass.

6. **`docs/superpowers/` is ephemeral** — plan docs are session artifacts. Delete after the work ships, or compress and archive. Never accumulate indefinitely.

7. **Backup is git, not `.original.md`** — before compressing, confirm the file is committed (`git status -- <file>`). After compression, `git diff <file>` to verify. Rollback via `git checkout -- <file>`. Never rely on sidecar `.original.md` files — they silently corrupt alongside the source.

8. **Fidelity check after compression** — skim the diff for meaning-shifts, not just link integrity. A compressed sentence that reads opposite to the original (e.g. "do X" → "don't do X") costs more than the saved tokens. For dense sections (React Compiler gotcha, glossary entries), compare the compressed version against the original side-by-side.

9. **Compression targets by density:**
   - Behavioral rules, vocabulary glossaries: 0–15% (light trim only)
   - Reference/spec files (DESIGN.md, patterns.md): 40–60%
   - Audit reports, checklists: 60–80%
   - ADRs: 0% — reasoning is load-bearing, compress only after the decision settles and you're revisiting for reference

10. **Delete `.original.md` sidecars after verification** — the caveman skill leaves backup files scattered in `.local/share/caveman-compress/backups/`. After confirming the compressed file is correct (rule 7+8), run `rm -rf ~/.local/share/caveman-compress/backups/` to clean up. These files are dead weight — git history is the real backup.

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
