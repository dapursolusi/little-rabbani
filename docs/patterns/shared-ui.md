# Shared UI Patterns

## Location

Cross-feature components under `src/components/<concern>/` e.g. `forms/` . Auto-generated shadcn base-nova under `src/components/ui/` — never edit.

**Cross-feature feature components** (used by 2+ features, e.g. `TermSelector`, `ClassSessionSelector`) live under `src/components/features/<domain>/`. Entity-specific components stay in `src/features/<e>/components/`.

## Export convention

- **Default export** — feature components and single-consumer shared pieces (`form.tsx`, `client.tsx`, `form-field-generator.tsx`, selectors).
- **Named export** — widely-consumed primitives (`DataTable`, `Modal`, `EmptyState`, `Pagination`, `SearchInput`, `ContentTabs`, `RowActionsDialog`, `PageBreadcrumbs`).

## cn() utility

```ts
import { cn } from '@/lib/utils';

// clsx + tailwind-merge
```

## EmptyState

`src/components/shared/empty-state.tsx` — renders when data list is empty. Props: `title`, `description`, `icon`, and `action` — a discriminated union `EmptyDataAction = HrefAction | CustomAction`:

```tsx
action={{ type: 'href', href: '/x', label: 'Tambah' }}
// or
action={{ type: 'custom', children: <...> }}
```

## Modal

`src/components/shared/modal.tsx` — dialog wrapper using shadcn `Dialog`. Props: `title`, `description`, `trigger` (href, render, text, icon), `content`, `footer`, `open`, `onOpenChange`. Linked automatically with `DataTable`'s `createForm` prop.

## ConfirmDialog

`src/components/sections/confirm-dialog.tsx` — destructive confirmation dialog. Used by `DataTableRowActions` for delete confirmation.

## Pagination

`src/components/shared/pagination.tsx` — standalone pagination component. Shows "Menampilkan X–Y dari Z" with Previous/Next buttons. Used by `DataTablePagination` internally.

## Badge colors

`src/utils/badge-color.ts` — `getDeterministicClass(name)` generates deterministic badge colors from a string. Used in table cells for entity badges. Status badges use `get-status-badge.tsx` (`src/components/shared/get-status-badge.tsx`).

## Icon handling

Hugeicons exclusively (`@hugeicons/react` + `@hugeicons/core-free-icons`), wrapped as `<HugeiconsIcon icon={XIcon} />`. Icons are passed as data (`IconSvgElement`) through props and validated with `isIconSvgElement()` (`src/utils/icon-checker.ts`).

## base-ui `render` composition

Compose interactive primitives with `render=` props instead of children-wrapping triggers:

```tsx
<Item render={<Link href={...} />}>...</Item>
<DialogTrigger render={<Button variant="default" render={trigger.render} />} />
```

Per-call classNames are inline utility strings; Tailwind v4 important-suffix (`w-full!`, `sm:col-span-2!`) is the idiom for overriding auto-generated ui tokens. No `cva()` outside `src/components/ui/`; `cn()` used sparingly.

## Format utilities

- `src/utils/date.ts` — `formatDate(dateStr)` ("Senin, 1 Januari 2024"), `getLocalDateString()`
- `src/lib/format.ts` — `formatDateShort(dateStr)` ("Senin, 11 Agu"), `formatAge(dob)` ("3 tahun 5 bulan")

## Content tabs

`src/components/shared/content-tabs.tsx` — tab navigation for content sections. Props include `fullWidth` / `maxWidthPx`.

## Page breadcrumbs

`src/components/shared/page-breadcrumbs.tsx` — breadcrumb navigation (`segments: { label, href? }[]`). Currently used only by settings pages; other pages roll their own h1 header.

## Search input

`src/components/shared/search-input.tsx` — standalone debounced search input (setTimeout-in-useEffect debounce, no debounce lib).

## Selectors (controlled-uncontrolled hybrid)

`src/components/features/{term,class-session}/*-selector.tsx` — twin shape: `value?/defaultValue?/onValueChange?` props, `useState` fallback when `value === undefined`, `id` on both Label and Select.

## Logger

`src/lib/logger.ts` — pino-based structured logger with PII redaction. `logger.info()`, `logger.error()`. Canonical for server code.

## Every page must

1. Export `metadata` object using `baseMetadata`

## Form field components

`src/components/ui/field.tsx` — shadcn Field primitives (Field, FieldLabel, FieldError, FieldSet, FieldLegend, FieldSeparator).

## Toast

Sonner for all user-facing mutations. Engine-owned forms toast inside `FormFieldGenerator` — consumers never double-toast. Copy is Indonesian; tone rules in SSOT `stacks/react.md` + project `nextjs.md` gotchas.
