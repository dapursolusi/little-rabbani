# nextjs-fullstack-template

Bun-first Next.js template with opinionated tooling. shadcn/ui (base-nova), Prettier, Husky, commitlint, Vitest, Playwright, t3-env, Tailwind v4, security headers, SEO scaffold. No deployment or monitoring baked in — pick those when you need them.

## Use

```bash
# Clone (don't fork — you want a clean history)
gh repo create my-app --template <this-repo> --public
cd my-app
bun install

# Rename and go
bun run dev
```

## What's included

| Layer              | What                                                                          |
| ------------------ | ----------------------------------------------------------------------------- |
| **Runtime**        | bun 1.3.13, Next.js 16, React 19                                              |
| **UI**             | shadcn/ui (base-nova / `@base-ui/react` / hugeicons), Tailwind v4 (CSS-first) |
| **Code quality**   | TypeScript strict, ESLint (next + prettier), Prettier + import sorting        |
| **Git guardrails** | Husky, commitlint (conventional commits), lint-staged                         |
| **Testing**        | Vitest (`vite-tsconfig-paths`), Playwright                                    |
| **Env safety**     | `@t3-oss/env-nextjs` + zod (build-time validation)                            |
| **Security**       | HTTP headers (X-Frame-Options, HSTS, etc.)                                    |
| **SEO**            | Metadata template, sitemap, robots.txt, JSON-LD, OG image placeholder         |
| **CI**             | GitHub Actions (checks + CodeQL + Dependabot auto-merge)                      |

## Scripts

| Command                | Action              |
| ---------------------- | ------------------- |
| `bun run dev`          | Dev server          |
| `bun run build`        | Production build    |
| `bun run lint`         | ESLint              |
| `bun run lint:fix`     | ESLint + auto-fix   |
| `bun run format`       | Prettier write all  |
| `bun run format:check` | Prettier check      |
| `bun run typecheck`    | `tsc --noEmit`      |
| `bun run test`         | Vitest (watch)      |
| `bun run test:run`     | Vitest (single-run) |
| `bun run test:e2e`     | Playwright          |

## Decisions deferred

These are deliberately not baked in. Add per-project when you know your context:

- **Hosting** — Vercel, Cloudflare Pages, Netlify, Render. Deploy workflows are your call.
- **Monitoring** — Sentry (or whatever). Add when you have users.
- **Database + ORM** — Drizzle + Postgres is the recommended default. Add when you need it.
- **Auth** — Auth.js v5. Add when you have non-public pages.

## File structure

```
src/
├── app/              → App Router pages
├── components/
│   ├── layout/       → Header, Footer, etc. (you build)
│   ├── sections/     → Page sections (you build)
│   └── ui/           → shadcn/base-nova (auto-generated)
├── lib/              → metadata, security-headers, utils
├── types/            → Shared types (you add)
e2e/                  → Playwright tests
tests/                → Vitest setup + unit tests
```

## Credits

Bootstrapped from [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) + preflight tooling applied via the [webapp-preflight](https://github.com/claudecode/skills/tree/main/webapp-preflight) skill.
