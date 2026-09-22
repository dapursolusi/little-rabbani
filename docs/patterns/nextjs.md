# Next.js / App Router Patterns

## Server Components by default

Pages are Server Components. Server first priority.`"use client"` only when hooks/event handlers needed. Data fetching happens directly in the component via Server Action calls.

## Server Actions (`'use server'`)

Every mutation is a Server Action. Pattern:

```
features/<entity>/actions.ts  →  features/<entity>/services.ts  →  features/<entity>/repositories/
```

**Layered:** actions.ts is the controller — parses input with `parseInput()`, calls service, returns result. services.ts owns all business logic including auth gating via `requireOwner()`. repositories/ talk to DB. Thin actions layer, fat services layer.

```ts
// actions.ts — controller only
export async function createXxx(input: Record<string, unknown>) {
  const parsed = parseInput({ schema, input, fallbackError: '...' });
  if (!parsed.success) return parsed;
  return xxxService.createXxx(parsed.data);
}

// services.ts — business logic + auth gate
export async function createXxx(input: XxxInput) {
  return requireOwner(async () => {
    try {
      const newItem = await xxxRepo.insert(input);
      return { success: true as const, data: newItem };
    } catch (error) {
      console.error('createXxx', error);
      return { success: false as const, error: 'Gagal membuat data' };
    }
  });
}
```

Read-only queries (`getXxx`) follow the same pattern — `requireOwner` in services, not actions.

**Action shape:** every action returns `ActionResult<T>`:

```ts
type ActionResult<T = void> =
  { success: true; data: T } | { success: false; error: string };
```

Narrow client-side with `if (!result.success)`.

**Reads:** export `async function getXxx(params?)` that calls service. Services wrap `requireOwner()`. Used directly in Server Components.

**Mutations:** `createXxx(input: unknown)` — parse with `parseInput()`, then delegate to service. `updateXxx(id, input)` — same pattern. `deleteXxx(id)` — soft delete via `deletedAt`.

## Page pattern

Every page exports `metadata` using `baseMetadata`:

```ts
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: '...' };
```

Page fetches data, passes to DataTable. Error state rendered inline with `<Alert>`:

```tsx
if (!result.success) {
  return (
    <Alert>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>...</AlertDescription>
    </Alert>
  );
}
```

## Data flow

```
Server Component / Client form → Server Action → Service → Repository → Drizzle → Neon
```

No `api/` routes except Better Auth's `api/auth/[...all]` and dev-session helper.

## React Compiler (ON)

`reactCompiler: true` in next.config. Auto-memoizes everything. **Stable-identity trap:** values from stable handles (TanStack Table `table` instance, zustand stores) get memoized stale. Mirror state into `useState`, derive UI from that.

## Metadata

`src/lib/metadata.ts` exports `baseMetadata` — use as spread in every page.

## Route proxy

`src/proxy.ts` handles auth checking + role-based routing + distributed tracing headers. See [auth.md](auth.md).

## Routing

App Router under `src/app/`. Auth routes under `src/app/(auth)/dashboard/`. Login under `src/app/login/`.

## Gotchas

- Port 3000 must be free.
- `'use client'` at top of file, not mid-file.
- `router.refresh()` after mutations to revalidate server data.
- No `api/` routes for business logic — Server Actions only.
