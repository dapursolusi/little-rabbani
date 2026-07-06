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

1. Mobile-first at all times. Test at 375px before 1440px.
2. Toast feedback (sonner) required on all user-facing mutations.
3. Check `env.mjs` before adding env vars. Add only when needed — don't pre-add "just in case".
4. Every page must export a `metadata` object. Use `baseMetadata` from `@/lib/metadata`.

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
- **Preflight checklist:** `/webapp-preflight` skill
- **Known issues:** See `docs/known-issues.md` (create when you hit one)

---

> **Make every line count — or delete it.**
