# Form Patterns

## FormFieldGenerator — shared renderer

`src/components/shared/form/form-field-generator.tsx` is the generic form engine. It takes:

- `schema` — zod schema (must be `ZodObject<ZodRawShape>`)
- `initialData` — prefill values as `Record<string, unknown>`
- `formFields` — `FormField[]` or `(watch) => FormField[]` (dynamic fields)
- `onSubmit` — handler returning `ActionResult`
- `onSuccess` — callback after successful submission
- `isEditing` — toggles toast message ("ditambahkan" / "diperbarui")
- `submitChildren` — optional custom submit button / footer

Engine handles: form state, validation (zod via `zodResolver`), toast feedback, grouping, submission.

## Zod resolver seam

The `zodResolver(schema)` → react-hook-form seam requires one cast:
```ts
const form = useForm<TForm>({
  resolver: zodResolver(schema) as never,
});
```
Accepted because variance on optional/nullable mapped types makes TS reject structurally identical types. One cast in shared component vs. per-entity components.

## Entity form files

Three files per entity under `features/<entity>/`:

1. **`schema.ts`** — zod schemas (create, update, combined forms). Exports both schema and inferred type.
2. **`fields.ts`/`fields.tsx`** — `FormField[]` factory function. Returns field list with `groupLabel` headers. Dynamic fields use `(watch) => ...` pattern.
3. **`components/form.tsx`** — thin `'use client'` wrapper. Passes schema, fields, initialData to `FormFieldGenerator`. Maps `onSubmit` to actions and `onSuccess` to route push.

## Field type system

`src/types/field.ts` defines:

- `FormFieldInput` — discrimated union by `type`: `'text' | 'date' | 'select' | 'custom' | 'switch' | 'hidden' | ...`
- `FormField` — adds `FormFieldGroupHeader` (bare `{ groupLabel }` for section headers)
- `SelectOption` / `SelectOptionGroup` — typed select options

## Field properties

```ts
{
  name: string;       // nested paths supported: 'kid.name', 'guardian.phone'
  label: string;
  type: StrictHTMLInputType | 'select' | 'custom' | 'switch' | 'hidden';
  required?: boolean;
  fullWidth?: boolean;  // col-span-2 in grid
  placeholder?: string;
  selectOptions?: SelectOption[];  // for 'select' type
  render?: (ctx) => ReactNode;     // for 'custom' type
}
```

## InputFieldRenderer

`src/components/shared/form/input-field-renderer.tsx` — renders the actual input per `type`:
- `'select'` → shadcn Select with grouped/flat options
- `'custom'` → calls `fieldConfig.render()` with field + fieldState
- `'switch'` → shadcn Switch
- `'hidden'` → null
- default → shadcn `<Input>` with `type` attribute

## Grouping

Sequential grouping: a `{ groupLabel }` header opens a `<FieldSet>` section. Every following field belongs to that section until the next header. Fields before any header land in the root block.

## Optional fields + nullable columns

Untouched RHF fields arrive as `undefined`. zod `min(1)` rejects them. Pattern: nullable+optional in schema, coerce `''` → `null` on write:

```ts
nickName: z.string().nullable().optional(),
// On insert: nickName: data.nickName || null,
```

## Combined forms

Discriminated union schema for mode-switching forms (e.g. kid+guardian):
```ts
const KidGuardianFormSchema = z.discriminatedUnion('guardianMode', [
  z.object({ guardianMode: z.literal('new'), kid: BaseKidSchema, guardian: GuardianSchema }),
  z.object({ guardianMode: z.literal('existing'), kid: BaseKidSchema, guardianId: z.string() }),
]);
```

The schema cast in the form component:
```ts
const schema = KidGuardianFormSchema as unknown as z.ZodObject<...> & { _output: ... };
```

## Inline edit in row actions

`RowActionsDialog` (see [tables.md](tables.md)) supports inline edit via `FormFieldGenerator` in a modal. Passes `schema`, `formFields`, `initialData`, `action(id, data)`.

## Page-level form

Forms accessed via dedicated route (e.g. `/dashboard/kid/create`) use `FormFieldGenerator` directly with `onSuccess: () => route.push('/dashboard/kid')`.