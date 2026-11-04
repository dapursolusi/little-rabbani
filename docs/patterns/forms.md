# Form Patterns

## FormFieldGenerator — shared renderer

`src/components/shared/form/form-field-generator.tsx` is the generic form engine. It takes:

- `schema` — zod schema (must be `ZodObject<ZodRawShape>`)
- `initialData` — prefill values as `Record<string, unknown>`
- `formFields` — `FormField[]` or `(watch) => FormField[]` (dynamic fields)
- `onSubmitAction` — handler returning `ActionResult`
- `onSuccessAction` — callback after successful submission
- `meta` — `{ label }` used for toast copy ("Label ditambahkan" / "diperbarui")
- `disabled` — renders the 7-day edit-window lock message instead of the form
- `submitChildren` — optional custom submit button / footer

Engine handles: form state, validation (zod via `zodResolver`), **all toast feedback and `router.refresh()`**, grouping, submission. Consumers never toast for engine-mounted forms.

`onSubmitAction` may return `undefined` to suppress the success toast.

## Zod resolver seam

The `zodResolver(schema)` → react-hook-form seam requires one cast:

```ts
const form = useForm<TForm>({
  resolver: zodResolver(schema) as never,
});
```

Accepted because variance on optional/nullable mapped types makes TS reject structurally identical types. One cast in shared component vs. per-entity components.

## Entity form files

Per entity under `features/<entity>/`:

1. **`validation.ts`** — zod schemas (create, update, combined forms). Exports both schema and inferred type.
2. **`fields.ts` / `fields.tsx`** — `FormField[]` factory function. Returns field list with `groupLabel` headers. Dynamic fields use `(watch) => ...`. Use `.tsx` only when a custom render embeds JSX.
3. **`components/form.tsx`** — thin `'use client'` wrapper:

```tsx
export default function TermForm({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <FormFieldGenerator
      schema={TermSchema}
      formFields={termFormFields()}
      initialData={{ name: '', startDate: new Date(), endDate: new Date() }}
      onSubmitAction={async (data) => createTerm(data)}
      onSuccessAction={onSuccess}
    />
  );
}
```

## Shared field factories

Cross-entity field configs live in `src/components/shared/form/fields.ts` — e.g. `termIdField` / `classSessionIdField` (select fields fed by feature constants). Reuse before defining a new one.

## Field type system

`src/types/field.ts` defines:

- `FormFieldInput` — `FormFieldBase & CustomHTMLInputType` (the union lives inside `CustomHTMLInputType`): `'text' | 'date' | 'select' | 'custom' | 'switch' | 'hidden' | 'toggle-group' | ...`
- `FormField` — adds `FormFieldGroupHeader` (bare `{ groupLabel }` for section headers)
- `SelectOption` / `SelectOptionWithoutGroup` / `SelectOptionWithGroup` — typed select options

## Field properties

```ts
{
  name: string;       // nested paths supported: 'kid.name', 'guardian.phone'
  label: string;
  type: StrictHTMLInputType | 'select' | 'custom' | 'switch' | 'hidden' | 'toggle-group';
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
- `'toggle-group'` → shadcn ToggleGroup
- `'hidden'` → null
- default → shadcn `<Input>` with `type` attribute

Note: `input-field-renderer.tsx` and `fields.ts` are **server-safe** (no `'use client'`) — only the generator is client.

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
  z.object({
    guardianMode: z.literal('new'),
    kid: BaseKidSchema,
    guardian: GuardianSchema,
  }),
  z.object({
    guardianMode: z.literal('existing'),
    kid: BaseKidSchema,
    guardianId: z.string(),
  }),
]);
```

The schema cast in the form component (keeps narrowing on `onSubmitAction`):

```ts
const schema = KidGuardianFormSchema as unknown as z.ZodObject<...> & { _output: ... };
```

## Hand-rolled client mutations (non-form)

Mutations that don't fit the form engine (e.g. a single Textarea save) repeat this shape — it is the contract engines already implement:

```tsx
const result = await saveTemplate({ content });
if (result.success) {
  toast.success(result.message ?? 'Tersimpan');
  router.refresh();
} else {
  toast.error(result.message);
}
```

Success reads `result.message ?? <default>` — services may set `message` on success; clients always fall back to a default label.

## Inline edit in row actions

`RowActionsDialog` (see [tables.md](tables.md)) supports inline edit via `FormFieldGenerator` in a modal. Passes `schema`, `formFields`, `initialData`, `action(id, data)`.

## Page-level form

Forms accessed via dedicated route (e.g. `/dashboard/kid/create`) use `FormFieldGenerator` directly with `onSuccessAction: () => route.push('/dashboard/kid')`.
