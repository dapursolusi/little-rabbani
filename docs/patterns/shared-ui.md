# Shared UI Patterns

## Location

Cross-feature components under `src/components/shared/`. Auto-generated shadcn base-nova under `src/components/ui/` — never edit.

## cn() utility

```ts
import { cn } from '@/lib/utils'; // clsx + tailwind-merge
```

## EmptyState

`src/components/shared/empty-state.tsx` — renders when data list is empty. Props: `title`, `description`, `actionLabel`, `actionHref`, `action` (custom ReactNode), `icon`. Uses shadcn `Empty` primitives.

## Modal

`src/components/shared/modal.tsx` — dialog wrapper using shadcn `Dialog`. Props: `title`, `description`, `trigger` (href, render, text, icon), `content`, `footer`, `open`, `onOpenChange`. Linked automatically with `DataTable`'s `createForm` prop.

## ConfirmDialog

`src/components/sections/confirm-dialog.tsx` — destructive confirmation dialog. Used by `DataTableRowActions` for delete confirmation.

## Pagination

`src/components/shared/pagination.tsx` — standalone pagination component. Shows "Menampilkan X–Y dari Z" with Previous/Next buttons. Used by `DataTablePagination` internally.

## Badge colors

`src/utils/badge-color.ts` — `getDeterministicClass(name)` generates deterministic badge colors from a string. Used in table cells for entity badges.

## Icon handling

`src/utils/icon-checker.ts` — `isIconSvgElement()` guard for Hugeicons icon type narrowing.

## Format utilities

`src/lib/format.ts`:
- `formatDate(dateStr)` — "Senin, 1 Januari 2024"
- `formatDateShort(dateStr)` — "Senin, 11 Agu"
- `formatAge(dob)` — "3 tahun 5 bulan" from YYYY-MM-DD

## Content tabs

`src/components/shared/content-tabs.tsx` — tab navigation for content sections.

## Page breadcrumbs

`src/components/shared/page-breadcrumbs.tsx` — breadcrumb navigation.

## Search input

`src/components/shared/search-input.tsx` — standalone search input.

## Logger

`src/lib/logger.ts` — pino-based structured logger with PII redaction. `logger.info()`, `logger.error()`.

## Every page must

1. Export `metadata` object using `baseMetadata`
2. Handle error state (Alert component)
3. Be responsive (mobile: stack, desktop: grid)

## Form field components

`src/components/ui/field.tsx` — shadcn Field primitives (Field, FieldLabel, FieldError, FieldSet, FieldLegend, FieldSeparator).

## Toast

Sonner for all user-facing mutations. Pattern: `toast.success('...')` / `toast.error('...')`. Wired in `FormFieldGenerator` for all form submissions.