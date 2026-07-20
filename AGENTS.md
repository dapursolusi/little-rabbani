<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Context

> **Phase:** Template / Starter
> **Team size:** Solo
> **Primary users:** Developers bootstrapping new Next.js projects

This is a full-stack Next.js template with opinionated tooling baked in. Use it as a starting point for new projects — clone, rename, build.

## Stack

- **Runtime:** bun 1.3.13 (`@types/node` matches local runtime via bun itself)
- **Package manager:** bun (never npm/pnpm/yarn — `bun run`, `bunx`, `bun add`)
- **Styling:** Tailwind CSS 4 (CSS-first — no `tailwind.config.ts`) + shadcn/ui (style: base-nova, primitives: `@base-ui/react`, icons: `hugeicons`)
- **Architecture:** Next.js App Router. Server Components by default. `"use client"` only when hooks/event handlers are needed.
- **Key libs:** zod for all I/O boundaries (`env.mjs`). sonner for toasts. CVA + clsx for component variants.
- **Testing:** Vitest (unit, native `tsconfigPaths` resolution). Playwright for E2E.
- **Data layer:** Not baked in — add Drizzle + Postgres per-project when needed. `env.mjs` ships a `DATABASE_URL` placeholder.
- **Auth:** Not baked in — add Auth.js per-project when needed.

## Architecture

```
UI Component (Server Component) → Server Action → Service → ORM → DB
```

- **API:** Server Actions only. No `api/` routes (except Stripe/cron/webhooks per-project — not in template).
- **Data flow:** Server Components fetch data directly. Server Actions for mutations. React Query only if per-project needs client-side caching.
- **File placement:** All source code under `src/`. `@/*` maps to `./src/*`.

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

| Entity                     | Convention  | Example           |
| :------------------------- | :---------- | :---------------- |
| Components                 | PascalCase  | `UserProfile.tsx` |
| Utilities                  | camelCase   | `formatDate.ts`   |
| Functions                  | camelCase   | `getUserById()`   |
| Props interfaces           | PascalCase  | `ButtonProps`     |
| Types                      | PascalCase  | `ComponentProps`  |
| Constants                  | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| File names (non-component) | kebab-case  | `api-endpoint.ts` |

## File Placement

| Component Type        | Location                   | Notes                             |
| :-------------------- | :------------------------- | :-------------------------------- |
| Page/Layout           | `src/app/`                 | App Router conventions            |
| Cross-page sections   | `src/components/sections/` | Grouped by page                   |
| Layout components     | `src/components/layout/`   | Header, Footer, MobileMenu        |
| Shared UI primitives  | `src/components/ui/`       | shadcn base-nova (auto-generated) |
| Utilities & constants | `src/lib/`                 | metadata, security-headers, utils |
| Types                 | `src/types/`               | Add per-project as needed         |
| Tests (unit)          | `tests/`                   | Vitest                            |
| Tests (E2E)           | `e2e/`                     | Playwright                        |

## Commands

Standard scripts (`dev`, `build`, `lint`, `format`, `typecheck`, `test*`) live in `package.json`. Only the invocations that aren't discoverable from there:

```bash
bunx shadcn@latest add <component>   # Add base-nova component (NOT in package.json)
bunx playwright install              # First-time browser binary setup
```

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
  - **Symptom signature:** "state updates but UI shows the old value." Concretely seen here — clicking "next" fetched the next page (row model updated) but the "Page X of Y" indicator and prev/next `disabled` states stayed stale. Smoking gun: an imperative read in the render body (`console.warn(table.getState().pagination.pageIndex)`) shows the fresh value while JSX reading the same expression shows the stale one, in the same render pass.
  - **Fix pattern:** mirror the library's state into React `useState` (so its identity changes on update) and read UI-derivable values from that — not from the stable handle's getters. For TanStack Table: use `state: { pagination }` + `onPaginationChange: setPagination`, then derive `pageCount`/`canPreviousPage`/`canNextPage` from the `pagination` React state (not `table.getState()`) and pass as props; the consuming JSX reads the props. Mutations (`table.nextPage()`) still call the table — only the **read path** moves off the stable handle.
  - **Diagnostic:** if you suspect this, add a `console.warn` in the render body reading the same value the JSX reads. If they disagree within one render, it's React Compiler memoization.
  - **Escape hatch:** the `"use no memo"` directive opts a single component out of React Compiler. Use sparingly — the state-mirror pattern is preferred.
  - **Generalize:** any "stale UI that should update" bug under `reactCompiler: true` → first ask: _is this value read through a stable handle hiding mutable state?_ (zustand stores, TanStack Query client refs, singleton service objects, etc. are all candidates.)
- ⚠️ **TypeScript `^6` resolution in CI** — `^6` in `package.json` can resolve to TypeScript 7.x (e.g. `7.0.2`) in CI, but `@typescript-eslint/typescript-estree@8.x` doesn't support TypeScript 7's new `Extension` enum. Linter crashes with `TypeError: Cannot read properties of undefined (reading 'Cjs')`. **Pin to an exact version** (`"typescript": "6.0.3"`) instead of a range — don't use `^`.
- ⚠️ **ESLint 10 + eslint-plugin-react 7.x incompatibility** — ESLint 10 removed `context.getFilename()`, but `eslint-plugin-react@7.x` still calls it in `lib/util/version.js`. Linter crashes on `.tsx` files with `TypeError: contextOrFilename.getFilename is not a function`. **Fix:** a postinstall patch (`scripts/patch-eslint-plugin-react.mjs`) replaces `contextOrFilename.getFilename()` → `contextOrFilename.filename`. Remove the patch when eslint-plugin-react ships 8.x.
- ⚠️ **`env.mjs` env vars required in CI** — `@t3-oss/env-nextjs` validates ALL env vars at import time. Tests importing `@/lib/auth` (which imports `env.mjs`) must set every variable in `beforeEach`, including `OPENROUTER_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`. CI workflows running `next dev` (E2E, Preview) need a full `.env` or injected secrets — missing vars crash startup.

## When to Ask

- If stuck after **2 attempts** → log blockers and ask.
- Any decision that adds a new npm package or changes the data layer.
- Any decision that changes how env vars are managed or validated.
- When choosing deployment hosting — not pre-decided in this template.

## References

- **Forward intent / backlog:** GitHub Issues per-project
- **Agent protocols:** See `CLAUDE.md` (AGENT_PROTOCOL.md rules)
- **UI:** See `DESIGN.md` at project root for any UI work.
- **Preflight checklist:** `/webapp-preflight` skill
- **Known issues:** See `docs/known-issues.md` (create when you hit one)
- **Runbooks:** `docs/runbooks/incident-response.md` — incident severity levels, triage flow, and escalation contacts
- **Deployment observability:** Check [Vercel dashboard](https://vercel.com/narasena/little-rabbani) after deploying to see build output and preview URLs
- **Feature flags:** Add feature flags via `src/lib/feature-flags.ts` — toggleable via `FF_*` env vars for safe rollouts
- **PII handling:** `src/lib/pii.ts` provides detection (`detectPiiField`) and masking (`maskPiiFields`, `maskPiiValue`) for kid/guardian personal data
- **Automated PR review:** Factory Droid review configured in `.factory/review.yml` — triggers on PRs

## Code Patterns

The codebase is mid-refactor (`src/lib/actions/` → `src/features/<entity>/`).
`docs/patterns.md` is the **living extraction** of the patterns actually
implemented so far — follow it for new and refactored code.

**Why a living doc instead of locking rules now:** the form engine covers 2 of
~8 entities and the backend vertical (services, logging, middleware) isn't
refactored yet — locking would freeze a half-built shape. The tradeoff is worth
it: the extra input tokens to load the patterns are cheaper than the
mental-battery cost of reviewing code that doesn't match your mental model. For
agentic work the priority order is **confidence > precision > speed**. A fast,
precise change you can't trust exhausts you faster than a slower one you can.

**Follow:** `docs/patterns.md` for new and refactored code. When the doc and
the code disagree, **the code wins** for now — update the doc in the same
change (or note the divergence in the handoff).

**Extract / create a new pattern** (your call as the agent) after a
substantial change lands a repeatable shape — e.g. a services/logging/
middleware layer emerges, or a second entity confirms a convention. Capture it
in `patterns.md` first; do **not** promote into AGENTS.md until the pattern
survives 3+ entities unchanged. Premature hardening is the failure mode this
doc exists to avoid.

**Split `patterns.md` into per-stack files** (`rules/typescript.md`,
`rules/react.md`, `rules/nextjs.md`, `rules/shadcn.md`, …) when either fires:

- the file grows too large to hold in one read, **or**
- a single domain's rules get dense enough that mixing them with other domains
  feels jarring — e.g. naming/type rules and then the next line jumps into
  component-usage rules. Each split file stays one coherent domain; keep a
  one-line index in `patterns.md` pointing at the splits.

### Settled hard rules (locked here, not in `patterns.md`)

These are decisions, not in-flux patterns — they live in AGENTS.md:

- **Schema-registry form engine:** each entity's Zod schema is registered
  in `src/components/shared/form/schema-registry.ts` keyed by name;
  `DefaultFormFields` looks it up via the `schemaKey` prop. One `as never` cast
  at the `zodResolver` ↔ `react-hook-form` seam is accepted — zod v4's `$ZodType`
  variance makes generic passthrough unworkable across 3 library seams. Tradeoff:
  ~1 cast in a shared component vs. per-entity form components. Upgrade to
  per-entity components when `onSubmit` needs compile-time verification against
  a server-action param schema.
- **`src/components/ui/` is auto-generated** (shadcn base-nova) — never edited
  by hand. Brand customization happens via tokens in `globals.css` or
  per-call classNames.
- **Discriminated-union action results** (`{ success: true, data } | { success:
false, error }` with `as const`) — clients narrow with `if (!result.success)`.

Forms use a **schema registry** pattern: each entity's Zod schema is registered in `src/components/shared/form/schema-registry.ts` keyed by name, and `DefaultFormFields` looks it up via `schemaKey` prop. One `as never` cast at the `zodResolver` ↔ `react-hook-form` library seam is accepted — zod v4's internal `$ZodType` variance makes generic passthrough unworkable across 3 library seams. The tradeoff: ~1 cast in a shared component vs. per-entity form components (option 2 if compile-time schema matching matters).

```ts
// Adding a new form: register schema + key, use schemaKey in page
// schema-registry.ts
const schemas = {
  kid: KidFormSchema,
  guardian: GuardianFormSchema,
} as const satisfies Record<string, z.ZodObject<z.ZodRawShape>>;
```

When to upgrade to per-entity components: when `onSubmit` needs compile-time verification against a server-action param schema.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `narasena/little-rabbani` via the `gh` CLI. External PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, each role's string equals its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

---

> **Make every line count — or delete it.**
