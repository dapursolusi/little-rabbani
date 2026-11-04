# Next.js / App Router Patterns

## Server Components by default

Pages are Server Components. Server first priority. `"use client"` only when hooks/event handlers needed.

## Data flow

```
Server Component / Client form → Service → Repository → Drizzle → Neon
                                              ↑
Server Actions (mutations) — parse only ──────┘
```

- **Pages call services directly** (`import * as xxxService from '@/features/<entity>/services'`), not actions and not `db.query.*`.
- **Server Actions** exist for mutations (called from client components) — they are thin parse-and-forward shells, never fetch data for a page.
- No `api/` routes except Better Auth's `api/auth/[...all]` and the dev-session helper.

## Server Actions (`'use server'`)

Every mutation is a Server Action. Layering:

```
features/<entity>/actions[.ts|/]  →  services  →  repositories
```

**Actions are parse-only controllers.** One file per module (`actions.ts`) for single-entity modules; a directory + `index.ts` barrel once a layer serves 2+ entities (see [typescript.md](typescript.md) → Module layer granularity):

```ts
// actions.ts — parse and forward, nothing else
export async function createXxx(input: unknown) {
  const parsed = parseInput({ schema: XxxSchema, input, fallbackError: '...' });
  if (!parsed.success) return parsed;
  return xxxService.createXxx(parsed.data);
}

export async function updateXxx(id: string, input: unknown) {
  const parsed = parseInput({ schema: XxxSchema, input, fallbackError: '...' });
  if (!parsed.success) return parsed;
  return xxxService.updateXxx(id, parsed.data);
}
```

- Input is typed `unknown` (never `Record<string, unknown>`) — zod at the boundary.
- `'use server'` must be line 1 of every action file (see AGENTS.md gotcha).
- Multi-input actions: positional `(id, input)` or a single object with reserved `input` key.
- Services may call sibling services and repos; actions never touch `db`.

**Read actions** follow the same parse-only shape when they take filter params. Ungated parameterless reads may omit parsing.

## ActionResult

Every action/service returns `ActionResult<T>` (declared in `src/types/index.ts`):

```ts
type ActionResult<T = void> =
  | { success: true; message?: string; data: T; error?: never }
  | { success: false; message: string; data?: never; error?: ActionError };
```

- Failure field is **`message`** (string); `error` is an optional structured object (`validation | not_found | conflict | internal`).
- `parseInput()` returns an ActionResult directly from a failed zod parse — first issue only, plus `fieldErrors` when `withError: true`.
- Success may carry an optional `message`; clients render `result.message ?? <default label>`.
- Narrow client-side with `if (!result.success)`.

## Page pattern

Canonical standardized page (commit 7d8ad55):

```tsx
import { kidColumns } from '@/features/kid/columns';
import * as kidService from '@/features/kid/services';
import { DataTable } from '@/components/shared/table/data-table';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Murid' };

export default async function KidListPage() {
  const kids = await kidService.getKids();
  return <DataTable columns={kidColumns} data={kids.items} meta={...} />;
}
```

- **Every page exports `metadata`** — spread of `baseMetadata` (`src/lib/metadata.ts`, title template `%s | Little Rabbani`). Non-negotiable rule (AGENTS.md).
- Parallel independent fetches with `Promise.all`.
- `params` / `searchParams` are `Promise<...>` + `await` (Next 15), typed inline in the page signature.
- Missing resource → `notFound()`; missing required search param → **redirect to canonicalize** (`report/month` redirects to add `?termId=` when absent).
- No `loading.tsx` / `error.tsx` / `not-found.tsx` — pages handle missing data with `notFound()`/`redirect()` in the body; clients handle their own load/error states.

## Page composition (three shapes, by page kind)

1. **List page** — server page renders `<DataTable columns data meta emptyState />` directly.
2. **Interactive page** — server page fetches, hands plain-data props to `<XxxClient>` from `@/features/<e>/components/client`.
3. **Static/settings page** — inline JSX + `PageBreadcrumbs`.

## URL as filter state

List-filter pages keep filter state in the URL: server page redirects to fill required params, client components push changes via `pushParam()` (`src/utils/search-params.ts`). Remount a client subtree with `<XxxClient key={...}>` when server data changes under it.

## React Compiler (ON)

`reactCompiler: true` in next.config. Auto-memoizes everything. **Stable-identity trap:** values from stable handles (TanStack Table `table` instance) get memoized stale. Mirror state into `useState`, derive UI from that. See [tables.md](tables.md).

## Route proxy

`src/proxy.ts` handles auth checking + role-based routing + distributed tracing headers. See [auth.md](auth.md).

## Routing

App Router under `src/app/`. Auth routes under `src/app/(auth)/` — dashboard pages `(auth)/dashboard/...`, login at `(auth)/login/`. One route group `(auth)`, one nested layout (`dashboard/layout.tsx`).

## Auth gating — UNDECIDED

Auth gating placement (requireOwner in actions vs services; possible future `roleGate([...])` design) is **not settled** — see violations.md. Do not write new requireOwner guidance; existing call sites stay as-is until the design lands.

## Gotchas

- Port 3000 must be free.
- `'use client'` / `'use server'` at line 1, not mid-file.
- `router.refresh()` after mutations to revalidate server data.
- Client components call feature actions directly (`import { saveTemplate } from '@/features/.../actions'`) like async functions — no react-query/SWR.
- Toast copy is Indonesian; `toast.success` on success, `toast.error` on failure, `toast.warning` on delete-confirm.
