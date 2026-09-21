# Known Issues

## Active

- **Vitest tsconfigPaths** — uses native `resolve.tsconfigPaths` (reads `tsconfig.json` paths automatically, no plugin needed). Don't add a separate vite plugin.
- **Tailwind v4 CSS-first** — config in `globals.css`. No `tailwind.config.ts`. Use `@theme inline` for custom values.
- **shadcn preset** — `bI9A` pins style, base color, icon library, and primitives in one shot.
- **`env.mjs`** — uses `@t3-oss/env-nextjs`. All env vars MUST be registered there. Tests importing `@/lib/auth` must set every env var in `beforeEach` (including `OPENROUTER_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). CI needs full `.env` or injected secrets.
- **Port 3000** — must be free. Kill stale Next.js procs first.
- **TypeScript `^6` in CI** — `^6` can resolve to TS 7.x; `@typescript-eslint/typescript-estree@8.x` crashes. **Pin to exact version** (`"typescript": "6.0.3"`).
- **ESLint 10 + eslint-plugin-react 7.x** — ESLint 10 removed `context.getFilename()`. Postinstall patch (`scripts/patch-eslint-plugin-react.mjs`) replaces it. Remove when eslint-plugin-react ships 8.x.
- **DB schema changes require migration** — editing `.ts` alone drifts from live DB. After any schema change: `bun run db:generate` → `bun run db:migrate` → verify. A 500 on `with: { ... }` often means a column referenced in schema doesn't exist in DB.
- **CodeGraph / graphify indexes stale after refactors** — both are snapshot indexes. Reindex explicitly: `codegraph index` or `codegraph sync`; `graphify update . --force`. When answer cites non-existent path, treat index as stale.
