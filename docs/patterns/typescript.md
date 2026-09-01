# TypeScript Patterns

## Discriminated-union results

Every Server Action returns a discriminated union — the single pattern for all I/O boundaries:

```ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
```

Declared in `src/lib/actions/require-owner.ts`. Always `as const` on the literal so TS narrows with `if (!result.success)`.

## `parseInput()` — zod at every trust boundary

```ts
parseInput({ schema, input, fallbackError })
// → { success: true, data: z.infer<S> } | { success: false, error: string }
```

Returns an ActionResult directly from a failed zod parse. No branching needed in the action — just `if (!parsed.success) return parsed`.

## Entity types pattern

```ts
// types.ts
export interface Entity extends BaseDTOResponse, EntityInput {}
```

`BaseDTOResponse` provides `id`, `createdAt`, `updatedAt`, `deletedAt ?`. Entity-specific input type comes from `z.infer<typeof EntitySchema>`.

## Re-export pattern

`schema.ts` exports both the schema and the inferred type:
```ts
export { EntitySchema };
export type EntityInput = z.infer<typeof EntitySchema>;
```

## Form field types

`src/types/field.ts` defines `FormFieldInput` (discriminated union by `type`), `FormField` (includes `FormFieldGroupHeader`), `SelectOption`, `SelectOptionGroup`. StrictHTMLInputType mirrors but does not import from React — intentional to avoid import churn.

## Repository exports

Repositories under `repositories/` dir with `index.ts`:
```ts
export * as kidRepo from './kid';
export * as guardianRepo from './guardian';
```

## No `any`

Use `unknown` or proper interfaces. `as never` at the zodResolver ↔ react-hook-form seam is the one accepted cast (see forms.md).

## `cn()` utility

```ts
import { cn } from '@/lib/utils'; // clsx + tailwind-merge
```

## Ponytail comments

Known-simplification comments marked with `// ponytail:` explaining the tradeoff and upgrade path.

## Icon type

Hugeicons icons use `IconSvgElement` from `@hugeicons/react`. The `isIconSvgElement()` utility in `src/utils/icon-checker.ts` guards runtime type checks.