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
and the app rebuilt from the auth shell. Domain vocabulary lives in
`CONTEXT.md`. Treat `_archives/` as read-only reference — it is the old v1,
not live code.

## Stack

- **Runtime:** bun 1.3.13 (`@types/node` matches local runtime via bun itself)
- **Package manager:** bun (never npm/pnpm/yarn — `bun run`, `bunx`, `bun add`)
- **Styling:** Tailwind CSS 4 (CSS-first — no `tailwind.config.ts`) + shadcn/ui (style: base-nova, primitives: `@base-ui/react`, icons: `hugeicons`)
- **Architecture:** Next.js App Router. Server Components by default. `"use client"` only when hooks/event handlers are needed.
- **Key libs:** zod for all I/O boundaries (`env.mjs`). sonner for toasts. clsx for class merging (no CVA outside auto-generated `ui/`). `@tanstack/react-table` v9 for DataTable.
- **Testing:** Vitest (unit, native `tsconfigPaths` resolution). Playwright for E2E. All tests under `tests/` mirroring `src/`.
- **Data layer:** Drizzle ORM + Neon Postgres (`@neondatabase/serverless`, WS `Pool` driver — required for transactions). Schema in `src/db/schema/`, one file per entity, exported from `src/db/schema/index.ts`. `db` singleton at `src/db/index.ts`. DB scripts (`db:generate`/`db:push`/`db:migrate`) use `--env-file=.env.local`. Schema changes ship via `db:generate` → `db:migrate`, never `db push`.
- **Auth:** Better Auth (better-auth + `@better-auth/drizzle-adapter`), Google OAuth + dev-session bypass. Roles: `owner` | `teacher`. Auth gating placement (requireOwner / future roleGate) is **undecided** — see `docs/patterns/violations.md`.

## Architecture

```
Server Component / Client form → Service → Repository → Drizzle → Neon
                                        ↑
           Server Actions (mutations, parse-only) ──┘
```

- **API:** Server Actions only. No `api/` routes except Better Auth's `api/auth/[...all]` and the dev-session helper. Auth traffic routes via `src/proxy.ts` (session + role-based route guard).
- **Data flow:** Server Components call **services** (`import * as xxxService from '@/features/<e>/services'`), which call repositories. Mutations are Server Actions returning a **discriminated-union result** (`{ success: true, message?, data } | { success: false, message, error? }`, `as const`) so client forms narrow with `if (!result.success)`.
- **Action I/O:** every Server Action parses `unknown` input with `parseInput()` (zod, `src/lib/actions/`). Actions are parse-and-forward shells — they never touch `db`.
- **Feature verticals:** entity code under `src/features/<entity>/` (`actions.ts`, `validation.ts`, `fields.ts(x)`, `constants.ts`, `columns.tsx`, `components/`, `types.ts`). Shared UI under `src/components/shared/`; cross-feature feature components under `src/components/features/`. Flat layer files by default; split a layer to a directory + `index.ts` barrel once it serves 2+ entities.
- **File placement:** All source code under `src/`. `@/*` maps to `./src/*`. Tests live in `tests/` (mirroring `src/`), not `src/features/_tests_/`.

## Modules

Implemented domain verticals under `src/features/<name>/`: **kid** (kid+guardian combined form ADR-0001, identity-only kid ADR-0002, transactional inserts ADR-0003), **kid-enrollment**, **term**, **class-session**, **theme**, **daily-class-report**, **report** (kid + month), **auth**. Routes under `/dashboard/<name>/`. Patterns per stack in `docs/patterns/`; debt in `docs/patterns/violations.md`.

## Rules

1. Responsive design is non-negotiable, shadcn already support this. Focus on mobile and desktop.
2. Must use shadcn components at all times. Prefer components from custom registries first then the standard shadcn.
3. Toast feedback (sonner) required on all user-facing mutations.
4. Check `env.mjs` before adding env vars. Add only when needed — don't pre-add "just in case".
5. Every page must export a `metadata` object. Use `baseMetadata` from `@/lib/metadata`.

## Forbidden

- ❌ NO `npm run` / `npx` — use `bun run` / `bunx`
- ❌ NO `any` types — use `unknown` or a proper interface
- ❌ NO `console.log`/`console.error` in server code — use `logger` (`src/lib/logger.ts`, pino + redaction)
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

Acronyms are words in identifiers: `Dcr`, `getDcrs` — not `DCR`, `getDCRs`.
Enum constants follow the named-map stack (`NAME` / `Name` type / `NAME_VALUES` / `NAME_LABELS` — see `docs/patterns/typescript.md`).

## File Placement

| Component Type                      | Location                                             | Notes                                                          |
| :---------------------------------- | :--------------------------------------------------- | :------------------------------------------------------------- |
| Page/Layout                         | `src/app/`                                           | App Router conventions                                         |
| Feature sections                    | `src/features/<module>/components/`                  | Per-module components                                          |
| Cross-feature feature components    | `src/components/features/<domain>/`                  | Used by 2+ features (e.g. TermSelector)                        |
| Layout components                   | `src/components/layout/`                             | Global shell                                                   |
| Shared UI primitives                | `src/components/ui/`                                 | shadcn base-nova (auto-generated)                              |
| Shared sections & logic-heavy comps | `src/components/sections/`, `src/components/shared/` | confirm-dialog, empty-state, pagination; form engine, table    |
| Utilities & constants               | `src/lib/`                                           | 3rd party, all that affecting domain                           |
| Helpers                             | `src/utils/`                                         | helpers                                                        |
| Types                               | `src/types/`                                         | Add per-project as needed                                      |
| Tests (unit / integration)          | `tests/features/<module>/`, `tests/`                 | Vitest, mirrors `src/`                                         |
| Tests (E2E)                         | `e2e/`                                               | Playwright                                                     |
| Server Actions                      | `src/features/<module>/actions.ts`                   | Controllers/Actions                                            |
| Services                            | `src/features/<module>/services.ts`                  | Business Logic                                                 |
| Repositories                        | `src/features/<module>/repositories.ts`              | Repositories                                                   |
| Any layer w/ 2+ entities            | `src/features/<module>/<layer>/`                     | Directory + barrel `index.ts` (`export * as xRepo from './x'`) |
| Zod validation                      | `src/features/<module>/validation.ts`                | Shared primitives in `src/lib/validation/common.schema.ts`     |

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
- ⚠️ **`'use server'` must be line 1 of every `actions.ts` / `actions/<name>.ts`.** Missing it compiles fine — the action silently becomes a plain function, Turbopack bundles the whole server chain (services → repos → `db` → Neon driver) into the client, and it fails at runtime with a misleading DB error (`No database host or connection string was set` wrapped in "Failed query"). Do NOT put it on a barrel `index.ts` that re-exports (`export * as ...`) — only async function exports are allowed there; build error: `Only async functions are allowed to be exported in a "use server" file`.
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

Two rule layers — don't intertwine them:

- **General project rules** live here in AGENTS.md (architecture, conventions, gotchas, locked decisions).
- **Per-stack/task/dep specifics** live in `docs/patterns/<topic>.md`: [typescript](patterns/typescript.md), [nextjs](patterns/nextjs.md), [database](patterns/database.md), [forms](patterns/forms.md), [tables](patterns/tables.md), [auth](patterns/auth.md), [shared-ui](patterns/shared-ui.md). Personal-universal principles live in the SSOT `stacks/` files and lose to project docs on overlap.

Follow `docs/patterns/` for new code. Code wins if doc disagrees. **Extract new pattern** after a repeatable shape lands. Promote to AGENTS.md only after 3+ entities use it unchanged.

### Settled hard rules (locked here)

These are decisions, not in-flux patterns:

- **Generic form engine:** shared renderer `FormFieldGenerator` (`src/components/shared/form/form-field-generator.tsx`) + `InputFieldRenderer`. Takes Zod schema, `initialData`, `FormField[]` from the entity's `fields.ts(x)` (`src/types/field.ts`). Grouping via `{ groupLabel }` headers → `<FieldSet>` sections. Zod resolver `zodResolver(schema) as never` — one cast at the resolver↔RHF seam (ADR-0003). Upgrade to per-entity form components when `onSubmit` needs compile-time verification against action param schemas.
- **`src/components/ui/` is auto-generated** (shadcn base-nova) — never hand-edited. Brand customization via `globals.css` tokens or per-call classNames.
- **Discriminated-union action results** with `as const` — exact contract in `docs/patterns/typescript.md`.
- **Index every FK column by default** — details in `docs/patterns/database.md` + SSOT `stacks/database.md`.
- **Auth gating placement is undecided** (requireOwner action-level vs service-level vs future `roleGate()`). Don't write new call-site guidance; track in `docs/patterns/violations.md`.

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
