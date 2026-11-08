<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Context

> **Phase:** Active dev — V2 rebuild (kid module shipped)
> **Team size:** Solo
> **Primary users:** Preschool owner-operator (Hanifah)

## Stack

- **Package manager:** bun (never npm/pnpm/yarn — `bun run`, `bunx`, `bun add`)
- **Styling:** Tailwind CSS 4 (CSS-first — no `tailwind.config.ts`) + shadcn/ui (style: base-nova, primitives: `@base-ui/react`, icons: `hugeicons`)
- **Architecture:** Next.js App Router. Server Components by default. `"use client"` only when hooks/event handlers are needed.
- **Key libs:** zod for all I/O boundaries (`env.mjs`). sonner for toasts. clsx for class merging (no CVA outside auto-generated `ui/`). `@tanstack/react-table` v9 for DataTable.
- **Testing:** Vitest (unit, native `tsconfigPaths` resolution). Playwright for E2E.
- **Data layer:** Drizzle ORM + Neon Postgres (`@neondatabase/serverless`, WS `Pool` driver — required for transactions).
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

## Rules

1. Inspect source and relevant docs rather than assuming the docs are exhaustive.
2. After commit / PR / task done, suggest to update stale or outdated contexts, docs, or rules.
3. Responsive design is non-negotiable, shadcn already support this. Focus on mobile and desktop.
4. Must use shadcn components at all times. Prefer components from custom registries first then the standard shadcn.
5. Toast feedback (sonner) required on all user-facing mutations.
6. Check `env.mjs` before adding env vars. Add only when needed — don't pre-add "just in case".
7. Every page must export a `metadata` object. Use `baseMetadata` from `@/lib/metadata`.

## Forbidden

- ❌ NO `npm run` / `npx` — use `bun run` / `bunx`
- ❌ NO `any` types — use `unknown` or a proper interface
- ❌ NO `console.log`/`console.error` in server code — use `logger` (`src/lib/logger.ts`, pino + redaction)
- ❌ NO refactoring working legacy code unless told to
- ❌ NO `@apply` in CSS — Tailwind v4 doesn't support it
- ❌ NO editing `src/components/ui/` — shadcn base-nova components are auto-generated

## Project Structures & File Placement

| Item                            | Notes                                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/`                          | App codebase lives here                                                                                                                                                                                                                                                                                                         |
| `├──app/`                       | Next.js router pages. Route groups `(group)/` for auth/public splits. `api/` only for auth framework routes                                                                                                                                                                                                                     |
| `├──components/`                | Shared components only — nothing entity-specific                                                                                                                                                                                                                                                                                |
| `│  ├──features/<feature>/`     | Components shared by 2+ feature verticals, e.g. `term/term-selector.tsx`. Not `src/features/` (vertical code) — components extracted from them                                                                                                                                                                                  |
| `│  ├──layout/`                 | Global shell: sidebar, header, breadcrumbs                                                                                                                                                                                                                                                                                      |
| `│  ├──sections/`               | Shared section blocks: confirm-dialog, empty-state, pagination, search-input                                                                                                                                                                                                                                                    |
| `│  ├──<concern>/`                 | Shared logic-heavy concern specific: form engine (`forms/`), table (`tables/`)                                                                                                                                                                                                                                                                               |
| `│  └──ui/`                     | shadcn UI primitives (auto-generated, never hand-edited)                                                                                                                                                                                                                                                                        |
| `├──config/`                    | App config: navigation, constants                                                                                                                                                                                                                                                                                               |
| `├──contexts/`                  | React contexts (e.g. ongoing term context)                                                                                                                                                                                                                                                                                      |
| `├──db/`                        | Drizzle: `schema/` (one file per entity), `selections/` (column selections), `seeds/`                                                                                                                                                                                                                                           |
| `├──features/<module>/`         | Feature vertical — one dir per module (at least 1 entity). One flat file manages ONE entity's concern by default: e.g. `actions.ts`, `services.ts`, `validation.ts`, `types.ts`, `columns.tsx`, `fields.tsx`, `constants.ts`, `navigation.ts`. Split to directory + index barrel on concerns when operate more than one entity. |
| `├──features/<module>/<layer>/` | Domain with sub-modules splits into nested dirs, e.g. `report/kid/`, `report/month/` — same file layout per sub                                                                                                                                                                                                                 |
| `│  ├──actions`                 | Controller / Actions                                                                                                                                                                                                                                                                                                            |
| `│  ├──columns`                 | Data table columns constants, `.ts` by default. `.tsx` when need rendering.                                                                                                                                                                                                                                                     |
| `│  ├──components/`             | Feature client components                                                                                                                                                                                                                                                                                                       |
| `│  ├──constants.ts`            | Feature constants                                                                                                                                                                                                                                                                                                               |
| `│  ├──fields`                  | Data table columns constants, `.ts` by default. `.tsx` when need rendering.                                                                                                                                                                                                                                                     |
| `│  ├──repositories`            | Feature db repositories                                                                                                                                                                                                                                                                                                         |
| `│  ├──services`                | Feature business logic                                                                                                                                                                                                                                                                                                          |
| `│  └──validations`             | Feature I/O validation                                                                                                                                                                                                                                                                                                          |
| `├──hooks/`                     | Shared React hooks                                                                                                                                                                                                                                                                                                              |
| `├──lib/`                       | Framework/infra glue: `actions/` (parseInput, requireOwner),`ai/`, `validation/`, `auth.ts`, `pii.ts`                                                                                                                                                                                                                           |
| `├──types/`                     | Per-project shared types                                                                                                                                                                                                                                                                                                        |
| `└──utils/`                     | Pure helpers                                                                                                                                                                                                                                                                                                                    |
| `tests/`                        | Vitest tests. Mirrors `src/`: `tests/features/<feature>/`, `tests/lib/`, `tests/utils/`. Shared fakes in `tests/helpers/`                                                                                                                                                                                                       |

## Commands

See [package.json](package.json). Use `bun run xxx`. Additional:

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
- **Per-stack/task/dep specifics** live in `docs/patterns/<topic>.md`: Read only the relevant stack file when working in that specific stack.
- Follow `docs/patterns/` for new code. Code wins if doc disagrees. **Extract new pattern** after a repeatable shape lands.

### Settled hard rules (locked here)

These are decisions, not in-flux patterns:

- Brand customization via `globals.css` tokens or per-call classNames.
- **Auth gating placement is undecided** (requireOwner action-level vs service-level vs future `roleGate()`). Don't write new call-site guidance; track in `docs/patterns/violations.md`.

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

## Documentation map

- `CONTEXT.md`: domain vocabulary, business rules, and product context.
- `DESIGN.md`: visual/UI direction.
- `docs/adr/`: settled architectural decisions and rationale.
- `docs/patterns/`: project-specific implementation patterns. Read only the relevant pattern for the task.
- `docs/known-issues.md` and `docs/patterns/violations.md`: unresolved or known technical debt; inspect before changing affected areas.
- `CLAUDE.md` / `.claude/`: Claude Code-specific instructions, skills, and subagent configuration.
- GitHub Issues: project backlog and task status.

## Working with this repository

Before coding, inspect the target feature, its neighboring implementation, relevant tests, and the relevant pattern/ADR if one exists. Source code, tests, and configuration establish current implementation; requirements and ADRs establish intended behavior. If they disagree, report the discrepancy rather than silently copying a possibly incorrect pattern.

Follow established project patterns. If a new pattern proves reusable, update the relevant pattern document. Promote it to this file only when it is a high-impact project-wide invariant used consistently across the codebase.
