# Generic form engine: FormFieldGenerator over a per-entity schema

The v2 form engine is a shared renderer — `FormFieldGenerator`
(`src/components/shared/form/form-field-generator.tsx`) + `InputFieldRenderer`
(`input-field-renderer.tsx`) — parameterized by three inputs:
`schema` (zod), `initialData`, and a `FormField[]` declared in the entity's
`form-fields.ts` (`src/types/field.ts`). Grouping into labeled sections
(`<FieldSet>` + `<legend>`) is driven by `{ groupLabel }` headers in the field
list — no separate registry step. An entity form is a thin wrapper
(`src/features/kids/components/kid-form.tsx`) that maps the generic result to
its server actions.

This replaces the v1 "schema-registry" design (a `schemaKey` → schema map in a
`schema-registry.ts` + `DefaultFormFields` lookup). With one entity
implemented there is nothing to index — passing the schema directly is simpler
and keeps the registry file, and its `as never` cast, out of the codebase.

**Status:** accepted — **implemented** (kid module).
**Considered options:** per-entity form components (boilerplate duplicated per
entity, deferred until `onSubmit` needs compile-time verification against a
server-action param schema); v1 schema-registry map (rejected — indirection
with one consumer).
**Consequences:** ~1 `as never` cast at the `zodResolver` ↔ react-hook-form
seam is accepted — zod v4's `$ZodType` variance makes generic passthrough
unworkable across the 3 library seams (zod → RHF resolver → RHF form). Grouping
headers give two-column responsive layout per section for free.
