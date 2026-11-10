# Next.js / App Router Patterns

Stack-specific mechanics. Data-flow principle, action/layering rules, page shapes, directive gotchas, URL-as-filter, React Compiler trap live in the personal SSOT `stacks/nextjs.md`.

## Server Actions (`'use server'`)

Layering: `features/<entity>/actions[.ts|/]` → `services` → `repositories`.

**Actions are parse-only controllers** (see SSOT for the full rule). Canonical shape:

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

- Multi-input actions: positional `(id, input)` or a single object with reserved `input` key.
- **Read actions** follow the same parse-only shape when they take filter params. Ungated parameterless reads may omit parsing.
- Services may call sibling services and repos; actions never touch `db`.

## ActionResult

Exact contract in [typescript.md](typescript.md) → Discriminated-union results. Success may carry optional `message`; clients render `result.message ?? <default label>`.

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

- `baseMetadata` at `src/lib/metadata.ts`, title template `%s | Little Rabbani`.
- Missing resource → `notFound()`; missing required search param → **redirect to canonicalize** (`report/month` redirects to add `?termId=` when absent).
- No `loading.tsx` / `error.tsx` / `not-found.tsx` — pages handle missing data in the body; clients handle their own load/error states.
- Independent fetches run in `Promise.all`.
- `params`/`searchParams` are `Promise<...>` + `await` (Next 15+), typed inline in the signature.
- Missing resource → `notFound()`; missing required search param → redirect to the canonical URL.

## Page composition (three shapes, by page kind)

1. **List page** — server page renders `<DataTable columns data meta emptyState />` directly.
2. **Interactive page** — server page fetches, hands plain-data props to `<XxxClient>` from `@/features/<e>/components/client`.
3. **Static/settings page** — inline JSX + `PageBreadcrumbs`.

## URL as filter state

List filters live in the URL: server page redirects to fill required params; client components push changes through one shared `pushParam` util. Remount a client subtree with `key={...}` when server data changes under it.

## Routing

App Router under `src/app/`. Route group `(auth)`: dashboard pages `(auth)/dashboard/...`, login at `(auth)/login/`. One nested layout (`dashboard/layout.tsx`).

## Auth gating — UNDECIDED

Auth gating placement (requireOwner in actions vs services; possible future `roleGate([...])` design) is **not settled** — see violations.md. Do not write new requireOwner guidance; existing call sites stay as-is until the design lands.

## Route proxy

`src/proxy.ts` handles auth checking + role-based routing + distributed tracing headers. See [auth.md](auth.md).

## Mutations

- Discriminated-union results (`ActionResult`-style) end to end; clients narrow with `if (!result.success)`.
- Toast, copy in Indonesian, on every user-facing mutation: success reads `result.message ?? <default label>`; failure toasts `result.message`.
- `router.refresh()` after mutations to revalidate server data.
- One shared form engine (schema + field-config driven) handles form state, validation, toasts, and refresh — entity forms are thin wrappers that never re-implement the flow.

## Project gotchas

- Port 3000 must be free.
