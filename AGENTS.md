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
  - **Symptom:** UI shows stale value while imperative read in render body shows fresh — React Compiler memoized the getter.
  - **Fix:** mirror state into React `useState`, derive UI values from that, not from the stable handle. For TanStack Table: `state: { pagination }` + `onPaginationChange: setPagination` → derive `pageCount`/`canPreviousPage`/`canNextPage` from `pagination` state. Mutations still call `table.nextPage()`.
  - **Escape hatch:** `"use no memo"` directive opts one component out.
  - **Generalized:** any stale-read bug under `reactCompiler: true` → check if value comes from a stable handle hiding mutable state (zustand stores, TanStack Query refs, singleton services).
- ⚠️ **TypeScript `^6` resolution in CI** — `^6` in `package.json` can resolve to TypeScript 7.x (e.g. `7.0.2`) in CI, but `@typescript-eslint/typescript-estree@8.x` doesn't support TypeScript 7's new `Extension` enum. Linter crashes with `TypeError: Cannot read properties of undefined (reading 'Cjs')`. **Pin to an exact version** (`"typescript": "6.0.3"`) instead of a range — don't use `^`.
- ⚠️ **ESLint 10 + eslint-plugin-react 7.x incompatibility** — ESLint 10 removed `context.getFilename()`, but `eslint-plugin-react@7.x` still calls it in `lib/util/version.js`. Linter crashes on `.tsx` files with `TypeError: contextOrFilename.getFilename is not a function`. **Fix:** a postinstall patch (`scripts/patch-eslint-plugin-react.mjs`) replaces `contextOrFilename.getFilename()` → `contextOrFilename.filename`. Remove the patch when eslint-plugin-react ships 8.x.
- ⚠️ **`env.mjs` env vars required in CI** — `@t3-oss/env-nextjs` validates ALL env vars at import time. Tests importing `@/lib/auth` (which imports `env.mjs`) must set every variable in `beforeEach`, including `OPENROUTER_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`. CI workflows running `next dev` (E2E, Preview) need a full `.env` or injected secrets — missing vars crash startup.

## When to Ask

- If stuck after **2 attempts** → log blockers and ask.
- Any decision that adds a new npm package or changes the data layer.
- Any decision that changes how env vars are managed or validated.
- When choosing deployment hosting — not pre-decided in this template.

## References

- Backlog: GitHub Issues per-project
- Agent protocols: `CLAUDE.md`, UI: `DESIGN.md`, Preflight: `/webapp-preflight`, Known issues: `docs/known-issues.md`
- Runbooks: `docs/runbooks/incident-response.md`, Deploy: [Vercel dashboard](https://vercel.com/narasena/little-rabbani)
- Feature flags: `src/lib/feature-flags.ts` (toggleable via `FF_*` env vars)
- PII handling: `src/lib/pii.ts` (`detectPiiField`/`maskPiiFields`/`maskPiiValue`)
- PR review: `.factory/review.yml`

## Code Patterns

The codebase is mid-refactor (`src/lib/actions/` → `src/features/<entity>/`).
`docs/patterns.md` is the **living extraction** of the patterns actually
implemented so far — follow it for new and refactored code.

**Why living doc, not locked rules:** form engine covers 2/~8 entities, backend vertical not refactored — locking freezes half-built shape. Premature hardening is the failure mode.

**Follow:** `docs/patterns.md`. Code wins if doc disagrees — update doc in same change.

**Extract new pattern** after repeatable shape lands. Capture in `patterns.md` first; promote to AGENTS.md only after 3+ entities use it unchanged.

**Split `patterns.md`** into per-stack files when it grows too large or domains feel jarring mixed. Keep one-line index in `patterns.md`.

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

Adding a new form: write `schema.ts`, register in `schema-registry.ts`:

```ts
const schemas = {
  kid: KidFormSchema,
  guardian: GuardianFormSchema,
} as const satisfies Record<string, z.ZodObject<z.ZodRawShape>>;
```

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

## Subagent Driven Development

Always use subagent driven development. Use `/cavecrew` skills for fetching subagents.

### Issue tracker

Issues live as GitHub issues in `narasena/little-rabbani` via the `gh` CLI. External PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, each role's string equals its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

---

> **Make every line count — or delete it.**
