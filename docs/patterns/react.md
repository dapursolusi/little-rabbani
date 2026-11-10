# React Project Pattern

## Forms

- One shared, schema-driven form engine owns: form state, validation, toast feedback, refresh. Entity forms are thin wrappers (schema + fields + submit handler) that never re-implement submit flow.
- Field configs are data (`FormField[]` factories), grouped by section headers; dynamic fields are functions of `watch`.
- Custom widgets inject via a `render` escape hatch — the engine stays generic.
- Optional-but-nullable fields: `.nullable().optional()` in schema, coerce `''` → `null` on write.

## UI composition

- Compose interactive primitives with `render=` props (base-ui style) instead of children-wrapping triggers.
- Icons passed as data through props based on the UI usually use shadcn + base UI + hugeicons (`IconSvgElement`), validated at runtime by a type guard.
- Per-call Tailwind classes inline; important-suffix (`class!`) to override component-library tokens. **No `cva()`** — variant logic lives in auto-generated UI primitives; elsewhere use conditional class strings via `cn()`.
- Toast copy in the app's user language; `toast.success` / `toast.error` / `toast.warning` (destructive confirm) — never double-toast (engine-owned forms toast once).

## File Size Guidelines for any *.tsx

- Preferred: 200-300 lines.
- Review: 300-400 lines.
- Strongly consider splitting: >400 lines.
- Line count is a warning, not an absolute rule.
- Split when responsibility become loosely coupled.
