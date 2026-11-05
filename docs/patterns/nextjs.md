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

## Page composition (three shapes, by page kind)

1. **List page** — server page renders `<DataTable columns data meta emptyState />` directly.
2. **Interactive page** — server page fetches, hands plain-data props to `<XxxClient>` from `@/features/<e>/components/client`.
3. **Static/settings page** — inline JSX + `PageBreadcrumbs`.

## Routing

App Router under `src/app/`. Route group `(auth)`: dashboard pages `(auth)/dashboard/...`, login at `(auth)/login/`. One nested layout (`dashboard/layout.tsx`).

## Auth gating — UNDECIDED

Auth gating placement (requireOwner in actions vs services; possible future `roleGate([...])` design) is **not settled** — see violations.md. Do not write new requireOwner guidance; existing call sites stay as-is until the design lands.

## Route proxy

`src/proxy.ts` handles auth checking + role-based routing + distributed tracing headers. See [auth.md](auth.md).

## Project gotchas

- Port 3000 must be free.
- URL filter pushes go through `pushParam()` (`src/utils/search-params.ts`).
- Toast copy is Indonesian; `toast.success` on success, `toast.error` on failure, `toast.warning` on delete-confirm.
