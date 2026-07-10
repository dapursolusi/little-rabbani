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

| Entity                     | Convention           | Example           |
| :------------------------- | :------------------- | :---------------- |
| Components                 | PascalCase           | `UserProfile.tsx` |
| Utilities                  | camelCase            | `formatDate.ts`   |
| Functions                  | camelCase            | `getUserById()`   |
| Props interfaces           | PascalCase, I-prefix | `IButtonProps`    |
| Types                      | PascalCase, T-prefix | `TComponentProps` |
| Constants                  | UPPER_SNAKE          | `MAX_RETRY_COUNT` |
| File names (non-component) | kebab-case           | `api-endpoint.ts` |

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

---

> **Make every line count — or delete it.**
