# Frontend Code Quality Audit Report

**Project:** Little Rabbani Preschool LMS  
**Date:** 2026-07-08  
**Auditor:** Frontend Developer Subagent  
**Scope:** `src/app/`, `src/components/sections/`, `src/components/layout/`, `src/components/ui/`  
**Stack:** Next.js App Router, shadcn/ui (base-nova), Tailwind CSS 4, hugeicons

---

## 1. shadcn Component Compliance Violations

The AGENTS.md mandates: **"Must use shadcn components at all times."** The following violations were found across the codebase.

### Installed shadcn components (in `src/components/ui/`):

badge, button, card, checkbox, dialog, dropdown-menu, input, label, select, sonner, switch, table, textarea

### Missing shadcn components (should be installed):

- **`sidebar`** — Both owner and teacher layouts use custom hand-rolled nav bars
- **`tabs`** — Capture roster uses custom button-based tabs
- **`navigation-menu`** — Layout navs should use this for accessibility
- **`tooltip`** — No tooltips anywhere; icon-only buttons lack accessible labels
- **`separator`** — Several places use `border-b` divs where Separator is more semantic
- **`skeleton`** — Settings page hand-rolls skeleton loaders with `animate-pulse` divs
- **`alert`** — Error/warning banners use styled `<div>` with colored backgrounds
- **`avatar`** — Not used but may be useful for user/guardian display
- **`toast`/`alert-dialog`** — `ConfirmDialog` is custom-built in `\src/components\sections\confirm-dialog.tsx` rather than using shadcn `alert-dialog`

### Violation Details (by file):

#### `src/app/(auth)/login/login-form.tsx` — CRITICAL (zero shadcn compliance)

| Line       | Element Used                                                           | Should Use                                                   |
| ---------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| ~20        | `<div className="... rounded-lg border ... shadow-sm">` styled as card | `<Card>` / `<CardContent>`                                   |
| 65         | `<button onClick={handleRetry} className="...">`                       | `<Button variant="outline">`                                 |
| 72         | `<svg className="h-4 w-4 animate-spin">` (spinner)                     | hugeicons spinner or `<Loader2>` equivalent                  |
| 101        | `<button onClick={handleSignIn} className="...">`                      | `<Button>`                                                   |
| 107        | `<svg className="h-5 w-5 ... animate-spin">` (spinner)                 | hugeicons component                                          |
| 128        | `<svg className="h-5 w-5" viewBox="0 0 24 24">` (Google logo)          | hugeicons Google icon or `<Button>` with icon prop           |
| throughout | Uses hardcoded `text-zinc-*`, `bg-zinc-*` instead of theme tokens      | Use CSS variables (`bg-background`, `text-foreground`, etc.) |

**This file uses ZERO shadcn components despite the project having them installed.**

---

#### `src/components/layout/logout-button.tsx`

| Line | Element Used                                                        | Should Use                   |
| ---- | ------------------------------------------------------------------- | ---------------------------- |
| 19   | `<button onClick={handleLogout} className="rounded-lg border ...">` | `<Button variant="outline">` |

---

#### `src/app/dashboard/owner/settings/page.tsx`

| Line | Element Used                                                                            | Should Use                                  |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| ~80  | `<section className="rounded-lg border ... bg-white p-4">` styled as card               | `<Card>` / `<CardHeader>` / `<CardContent>` |
| ~85  | `<div className="rounded-md bg-amber-50 ...">` styled alert                             | `<Alert>` (not installed)                   |
| ~120 | `<div className="rounded-md bg-blue-50 ...">` styled alert                              | `<Alert>`                                   |
| ~180 | Loading skeleton: `<div className="... animate-pulse ...">` hand-rolled                 | `<Skeleton>` (not installed)                |
| 206  | `<button type="button" onClick={handleUnsubscribe} className="...">`                    | `<Button variant="outline">`                |
| 218  | `<button type="button" onClick={handleRequestPermission} className="...">`              | `<Button>`                                  |
| 273  | `<input type="checkbox" checked={captureEnabled} ... peer sr-only>` + styled toggle div | `<Switch>` (installed, not used!)           |
| 295  | `<input type="checkbox" checked={scheduleEnabled} ... peer sr-only>` + toggle div       | `<Switch>` (installed, not used!)           |
| ~270 | `<span className="...">Ditolak</span>` styled as badge                                  | `<Badge variant="secondary">`               |

---

#### `src/app/dashboard/teacher/capture/[sessionId]/capture-roster.tsx` (10 violations)

| Line | Element Used                                                                                      | Should Use                                                                     |
| ---- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 587  | `<button type="button" onClick={handleBackToRoster}>` (back link)                                 | `<Button variant="ghost" size="sm">` or `<Link>` styled as button              |
| 608  | `<button type="button" onClick={() => setActiveTab('pass1')}>` (custom tab)                       | shadcn `<Tabs>` / `<TabsTrigger>` (not installed)                              |
| 619  | `<button type="button" onClick={() => setActiveTab('pass2')}>` (custom tab)                       | shadcn `<Tabs>` / `<TabsTrigger>`                                              |
| 674  | `<button type="button" onClick={() => handleMoodSelect(opt.value)}>` (mood selector)              | `<Button>` or radio group pattern                                              |
| 700  | `<button type="button" onClick={() => setAppetite(opt.value)}>` (appetite selector)               | `<Button>` or radio group pattern                                              |
| 730  | `<button type="button" onClick={() => handlePresenceChange(opt.value)}>` (presence selector)      | `<Button>` or radio group pattern                                              |
| 761  | `<button type="button" onClick={() => handleAbsenceReasonChange(opt.value)}>`                     | `<Button>` or radio group pattern                                              |
| 777  | `<input type="text" value={otherAbsenceReason} className="... border ...">`                       | `<Input>`                                                                      |
| 876  | `<button type="button" onClick={() => handleParticipationToggle(dcaId, 'yes')}>`                  | `<Button>` or shadcn ToggleGroup                                               |
| 889  | `<button type="button" onClick={() => handleParticipationToggle(dcaId, 'no')}>`                   | `<Button>` or shadcn ToggleGroup                                               |
| 923  | `<svg className="h-12 w-12 text-blue-300" ...>` (check icon)                                      | hugeicons component                                                            |
| 987  | `<button key={kid.id} type="button" onClick={() => handleSelectKid(kid)}>` (roster row as button) | Acceptable as interactive list, but should use `asChild` Button or proper ARIA |
| 1025 | `<svg className="h-4 w-4 ...">` (chevron icon)                                                    | hugeicons chevron component                                                    |

---

#### `src/components/sections/kid-form.tsx`

| Line | Element Used                                                                                  | Should Use                                                                 |
| ---- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 130  | `<select id="guardianId" name="guardianId" className="flex h-10 w-full ...">` (native select) | shadcn `<Select>` / `<SelectTrigger>` / `<SelectContent>` / `<SelectItem>` |

**Note:** The same file uses shadcn `<Select>` for the status field (line ~160) but a native `<select>` for guardian — inconsistent within the same form.

---

#### `src/components/sections/session-form.tsx`

| Line | Element Used                                                     | Should Use                         |
| ---- | ---------------------------------------------------------------- | ---------------------------------- |
| 116  | `<input id="isHoliday" type="checkbox" className="h-4 w-4 ...">` | `<Checkbox>` (installed, not used) |

---

#### `src/components/sections/session-edit-form.tsx`

| Line | Element Used                                                     | Should Use                         |
| ---- | ---------------------------------------------------------------- | ---------------------------------- |
| 124  | `<input id="isHoliday" type="checkbox" className="h-4 w-4 ...">` | `<Checkbox>` (installed, not used) |

---

#### `src/components/sections/csv-import-form.tsx`

| Line | Element Used                                                      | Should Use                                                                                                   |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 223  | `<button key={type.id} type="button" ...>` (import type selector) | `<Button>` or `<ToggleGroup>` or RadioGroup cards                                                            |
| 284  | `<input ref={fileInputRef} type="file" ...>` (file picker)        | Acceptable for file inputs (shadcn doesn't have a file component), but styling should use `<Button>` overlay |

---

#### `src/app/dashboard/owner/dcr/[sessionId]/dcr-form.tsx`

| Line | Element Used                                                                            | Should Use                             |
| ---- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| 228  | `<button key={opt.value} type="button" ...>` (deviation selector: done/skipped/partial) | `<Button>` group or shadcn ToggleGroup |
| 257  | `<svg className="h-4 w-4" ...>` (trash icon)                                            | hugeicons delete component             |

---

#### `src/app/dashboard/owner/reports/daily/[sessionId]/report-client.tsx`

| Line | Element Used                                                                                   | Should Use                                                       |
| ---- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 419  | `<svg className="h-4 w-4 animate-spin" ...>` (spinner)                                         | hugeicons component                                              |
| 455  | `<button type="button" onClick={() => handleExpandReport(kid.id, kid.name)}>` (kid report row) | `<Button variant="ghost">` or accessible `<details>`/`<summary>` |
| 476  | `<svg ... d="M19 9l-7 7-7-7">` (chevron down icon)                                             | hugeicons chevron component                                      |

---

#### `src/app/dashboard/owner/reports/monthly/[kidId]/[month]/report-client.tsx`

| Line | Element Used                                           | Should Use          |
| ---- | ------------------------------------------------------ | ------------------- |
| 305  | `<svg className="h-3 w-3 animate-spin" ...>` (spinner) | hugeicons component |

---

#### `src/app/dashboard/owner/reports/quarterly/[kidId]/report-client.tsx`

| Line | Element Used                                           | Should Use          |
| ---- | ------------------------------------------------------ | ------------------- |
| 330  | `<svg className="h-4 w-4 animate-spin" ...>` (spinner) | hugeicons component |
| 383  | `<svg className="h-3 w-3 animate-spin" ...>` (spinner) | hugeicons component |

---

#### Inline SVG icon usage (all should use hugeicons React components):

The hugeicons package (`@hugeicons/react` + `@hugeicons/core-free-icons`) is installed and correctly used in all `src/components/ui/` files. However, **23 inline SVG icons** appear in application/components code:

| File                                                      | Lines        | Icon Purpose                     |
| --------------------------------------------------------- | ------------ | -------------------------------- |
| `login-form.tsx`                                          | 72, 107, 128 | spinner, Google logo             |
| `owner/activity/activity-actions.tsx`                     | 101          | vertical dots (dropdown trigger) |
| `owner/page.tsx`                                          | 20           | (unknown decorative)             |
| `owner/dcr/[sessionId]/dcr-form.tsx`                      | 257          | trash icon                       |
| `owner/guardian/guardian-actions.tsx`                     | 57           | vertical dots                    |
| `owner/kid/kid-actions.tsx`                               | 53           | vertical dots                    |
| `owner/reports/daily/[sessionId]/report-client.tsx`       | 419, 476     | spinner, chevron                 |
| `owner/reports/monthly/[kidId]/[month]/report-client.tsx` | 305          | spinner                          |
| `owner/reports/quarterly/[kidId]/report-client.tsx`       | 330, 383     | spinners                         |
| `owner/schedule/[termId]/session-schedule-editor.tsx`     | 288          | (icon)                           |
| `teacher/capture/[sessionId]/capture-roster.tsx`          | 923, 1025    | check icon, chevron              |
| `teacher/capture/[sessionId]/page.tsx`                    | 116          | (icon)                           |
| `sections/offline-indicator.tsx`                          | 87           | spinner                          |
| `sections/session-actions.tsx`                            | 76           | vertical dots                    |
| `sections/teacher-pending-capture-banner.tsx`             | 63           | (icon)                           |
| `sections/teacher-schedule-view.tsx`                      | 88, 162      | calendar icon, (icon)            |
| `sections/term-actions.tsx`                               | 77           | vertical dots                    |

The "vertical dots" dropdown trigger SVG appears in at least 5 action components (kid, guardian, activity, session, term) — all should use the hugeicons equivalent (e.g., `MoreHorizontalIcon` or similar from `@hugeicons/core-free-icons`).

---

#### Custom nav used instead of shadcn Sidebar/NavigationMenu:

| File                                               | Issue                                                                                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/dashboard/owner/layout.tsx` (lines 29-50) | Custom `<nav className="flex gap-1 overflow-x-auto ...">` with `<Link>` styled links. No active state detection, no collapsible mobile menu, no shadcn Sidebar component |
| `src/app/dashboard/teacher/page.tsx` (lines 25-40) | Same pattern — custom `<nav>` with `<Link>` elements                                                                                                                     |

---

#### Custom tabs used instead of shadcn Tabs:

| File                                                                               | Issue                                                                                                                                                                        |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/dashboard/teacher/capture/[sessionId]/capture-roster.tsx` (lines 608-635) | "Pass 1" / "Pass 2" tabs built with `<button>` elements and manual state. No `role="tablist"`, no `role="tab"`, no keyboard arrow navigation, no ARIA `tabpanel` association |

---

## 2. Responsive Design Audit

### What IS responsive (good):

- **Page padding:** Consistent `p-4 sm:p-6` pattern across all pages (edit forms, list pages, report pages) — good mobile-first approach
- **Grid layouts:** Responsive grid column counts used correctly:
  - `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` (DCR list, daily reports list, schedule, sessions, teacher capture)
  - `grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4` (monthly/quarterly report grids)
- **Header layouts:** `flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between` used on kid, guardian, session, activity, term list pages
- **Form action buttons:** `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` on all form pages
- **Dialog widths:** Responsive `sm:max-w-[425px]` etc. on all DialogContent

### What is NOT responsive (issues):

| Issue                                  | File(s)                                                                                                                                                                                  | Severity                                                                                                                                                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Navigation: flat horizontal scroll** | `owner/layout.tsx` line 29, `teacher/page.tsx` line 25                                                                                                                                   | **HIGH** — `overflow-x-auto` on nav means users must scroll horizontally to reach nav items on mobile. There are 12 nav items in the owner layout. No hamburger menu, no collapsible drawer, no shadcn Sidebar with mobile sheet |
| **Tables: no responsive alternative**  | `kid/page.tsx`, `guardian/page.tsx`, `session/page.tsx`, `activity/page.tsx`, `term/page.tsx`                                                                                            | **MEDIUM** — Tables use `overflow-x-auto` wrapper which requires horizontal scrolling on mobile. This is the minimum viable approach but not ideal UX. Cards would be better for small screens                                   |
| **Fixed grid without breakpoints**     | `capture-roster.tsx` lines 728, 759 — `grid grid-cols-2 gap-2` won't adapt; acceptable for mood/presence selectors but the absence of any breakpoint means no layout change at any width |
| **Settings page max-width**            | `settings/page.tsx` — `max-w-2xl` with no mobile padding adjustment beyond `p-4`. The toggle row layout `flex items-center justify-between` could overflow text on very narrow screens   |

---

## 3. Data Display Audit

### Pagination: **NONE**

- **Zero pagination** exists anywhere in the application. The grep for `pagination|paginate|pageSize|perPage|limit=` returned no matches.
- All list pages fetch ALL records via server actions (`getKids()`, `getGuardians()`, `getSessions()`, `getActivities()`, `getSessionsForDcr()`) and render them in one batch.

### Search/Filter on list pages: **NONE**

- No search input on any list page
- No filter controls on any list page
- The only "filtering" is the activity page splitting active vs archived (in-memory `.filter()`, not user-controlled)
- Session page filters by `termId` via URL searchParams, but this is navigation-based, not search

### Sortable columns: **NONE**

- No table headers are sortable. All tables render in default query order with no user control over sorting.

### What happens with 100+ records:

| Page                                      | Data Source                                                 | Risk                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Kid list (`owner/kid/page.tsx`)           | `getKids()` returns ALL kids → `<Table>` maps all           | **HIGH** — No pagination, no virtualization. 100+ kids = 100+ table rows rendered in one go |
| Guardian list (`owner/guardian/page.tsx`) | `getGuardians()` returns ALL guardians                      | **HIGH** — Same issue                                                                       |
| Session list (`owner/session/page.tsx`)   | `getSessions(termId)` returns ALL sessions for term         | **MEDIUM** — Bounded by term but recurring session generation could create 50-100+ sessions |
| Activity list (`owner/activity/page.tsx`) | `getActivities()` returns ALL activities                    | **MEDIUM** — Likely small catalog                                                           |
| DCR list (`owner/dcr/page.tsx`)           | `getSessionsForDcr()` returns ALL sessions, grouped by term | **HIGH** — Cross-term query, unbounded                                                      |
| Reports list (daily/monthly/quarterly)    | Renders all kids or all reports                             | **MEDIUM**                                                                                  |

### Data table virtualization: **NONE**

- No `@tanstack/react-virtual` or similar. The `<Table>` component from shadcn renders all rows in a simple `.map()`.

---

## 4. Accessibility Audit

### Critical Issues:

| Issue                                   | Files                                                                                                        | Details                                                                                                                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Icon-only buttons lack `aria-label`** | `kid-actions.tsx`, `guardian-actions.tsx`, `activity-actions.tsx`, `session-actions.tsx`, `term-actions.tsx` | Dropdown trigger buttons use `<span className="sr-only">Buka menu</span>` which is good, but the Button itself wraps an SVG without `aria-label`                                                                                                                               |
| **Custom tabs not keyboard accessible** | `capture-roster.tsx` lines 608-635                                                                           | Pass 1/Pass 2 tabs built with `<button>` but no `role="tablist"`, `role="tab"`, `role="tabpanel"`, no arrow-key navigation, no `aria-selected`, no `aria-controls`                                                                                                             |
| **Roster list items as buttons**        | `capture-roster.tsx` line 987                                                                                | Kid roster uses `<button>` for row, which is technically accessible but a list (`<ul>`/`<li>` with `role="button"`) or proper listbox pattern would be more semantic                                                                                                           |
| **Color as sole indicator**             | `dcr/page.tsx`                                                                                               | Session cards use border color (`border-green-200`, `border-amber-200`, `border-red-200`) to indicate status. While badges also present, the color difference (`green`=done, `amber`=pending, `red`=holiday) could be missed by colorblind users if badge text weren't present |
| **Mood/appetite/presence selectors**    | `capture-roster.tsx` lines 674-761                                                                           | 5 mood buttons, 3 appetite buttons, 4 presence buttons have no `role="radiogroup"`/`role="radio"` semantics, no `aria-checked`, no `aria-pressed`. These are effectively radio groups but implemented as toggle buttons without ARIA                                           |
| **Participation toggle buttons**        | `capture-roster.tsx` lines 876-889                                                                           | Yes/No buttons have no `aria-pressed` or radio-group semantics                                                                                                                                                                                                                 |
| **Focus states**                        | Most raw buttons                                                                                             | Custom `<button>` elements with `transition-colors` rely on default browser focus ring. shadcn `<Button>` includes `focus-visible:ring-2` but the raw buttons in `capture-roster.tsx` and `settings/page.tsx` don't                                                            |
| **Form labels**                         | All forms                                                                                                    | Labels ARE properly associated using `<Label htmlFor>` + `id` — this is done correctly in all shadcn form components. However, `capture-roster.tsx` uses `<label className="...">` without `htmlFor` association on mood/appetite/presence sections (lines ~670, ~695, ~725)   |

### What IS accessible (good):

- All forms with shadcn `<Label>` properly use `htmlFor` and `id` associations
- Tables use proper shadcn Table component with semantic `<thead>`, `<tbody>`, `<th>`, `<td>`
- Empty states are well-handled with descriptive text and action buttons
- Dropdown menus use shadcn DropdownMenu (accessible by default)
- Dialogs use shadcn Dialog (accessible by default with focus trap)

---

## 5. Performance Audit

### `'use client'` usage:

| File                                                                                                                                                                                 | Justified?                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| All form components (`kid-form`, `session-form`, `session-edit-form`, `guardian-form`, `activity-form`, `term-form`, `term-cohort-form`, `session-generate-form`, `csv-import-form`) | Yes — need event handlers, state for form submission                |
| All action components (`kid-actions`, `guardian-actions`, `activity-actions`, `session-actions`, `term-actions`)                                                                     | Yes — need router, dropdown state                                   |
| `login-form.tsx`                                                                                                                                                                     | Yes — needs onClick handlers, loading state                         |
| `logout-button.tsx`                                                                                                                                                                  | Yes — needs onClick                                                 |
| `settings/page.tsx`                                                                                                                                                                  | Yes — needs client-side state, service worker API, Notification API |
| `capture-roster.tsx`                                                                                                                                                                 | Yes — complex client-side state management                          |
| `report-client.tsx` (3 files)                                                                                                                                                        | Yes — need client-side state for report generation/PDF download     |
| `offline-indicator.tsx`                                                                                                                                                              | Yes — needs browser online/offline API                              |
| `push-notification-setup.tsx`                                                                                                                                                        | Yes — service worker/push API                                       |
| `teacher-schedule-view.tsx`                                                                                                                                                          | Yes — needs state                                                   |
| `teacher-pending-capture-banner.tsx`                                                                                                                                                 | Yes — needs polling                                                 |
| `session-schedule-editor.tsx`                                                                                                                                                        | Yes — needs state                                                   |
| `conflict-dialog.tsx`, `confirm-dialog.tsx`                                                                                                                                          | Yes — controlled dialogs with state                                 |

**Verdict:** Client component usage is well-justified. No unnecessary `'use client'` directives found.

### Unnecessary re-renders:

- `settings/page.tsx` — `loadConfig()` called inside `useEffect` without request deduplication. Multiple state updates (`setLoading`, `setCaptureEnabled`, `setScheduleEnabled`) in sequence could be batched.

### Large list virtualization: **NONE**

- No list virtualization. The `capture-roster.tsx` renders all kids in a flat `.map()` (line ~980). The kid/guardian/session/activity tables render all rows.
- No `react-window`, `@tanstack/react-virtual`, or `react-virtualized` in dependencies.

### Code splitting:

- **Dynamic import used once:** `session/page.tsx` line ~230 uses `await import('@/lib/actions/term')` for `getTerms` in the `TermSelectorPage` function — good pattern for code-splitting server-side logic.
- **No `next/dynamic`** lazy loading of components. All heavy client components (`capture-roster.tsx`, `report-client.tsx` files) are statically imported, adding to the initial JS bundle.
- Report client components (`daily`, `monthly`, `quarterly`) should use `next/dynamic` since they're only needed when viewing a specific report.

### Bundle optimization concerns:

- `papaparse` is imported in `csv-import-form.tsx` — this is a heavy library. It's statically imported in a `'use client'` component, meaning it ships to the client bundle. Should be dynamically imported or moved to a server action.

---

## 6. Missing shadcn Components Summary

Based on the installed components and the app's features, the following shadcn components should be installed:

| Component          | Reason Needed                                                                                                            | Urgency      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------ |
| **`sidebar`**      | Both layouts use custom horizontal-scroll nav. shadcn Sidebar provides mobile sheet, collapsible, active-state tracking  | **CRITICAL** |
| **`tabs`**         | `capture-roster.tsx` hand-builds Pass 1/Pass 2 tabs with buttons, no keyboard nav, no ARIA                               | **HIGH**     |
| **`alert`**        | Error banners, warning banners, info banners all use styled `<div>` with colored backgrounds                             | **MEDIUM**   |
| **`skeleton`**     | Settings page hand-rolls skeleton loaders with `animate-pulse` divs                                                      | **MEDIUM**   |
| **`tooltip`**      | Icon-only buttons would benefit from accessible tooltips                                                                 | **LOW**      |
| **`alert-dialog`** | `confirm-dialog.tsx` is custom-built and should use the semantically correct `AlertDialog` for destructive confirmations | **MEDIUM**   |
| **`separator`**    | Multiple `border-b` divs used as visual separators                                                                       | **LOW**      |
| **`avatar`**       | Potential future use for guardian/teacher display                                                                        | **LOW**      |
| **`toggle-group`** | Mood/presence/appetite/deviation selectors are toggle button groups                                                      | **MEDIUM**   |
| **`scroll-area`**  | Tables and rosters could benefit from styled scroll areas                                                                | **LOW**      |
| **`accordion`**    | Report detail expansion in `report-client.tsx` uses manual expand/collapse                                               | **LOW**      |

---

## 7. Summary Score

### **Score: 5 / 10**

### Justification:

**Strengths (what's done well):**

- List pages (kid, guardian, session, activity) correctly use shadcn Table, Badge, Button via `buttonVariants`, and `cn()`
- Form components (kid, session, guardian, activity, term) mostly use shadcn Input, Label, Textarea, Select, Button correctly
- Responsive grid layouts with proper breakpoints (`sm:grid-cols-2 lg:grid-cols-3`)
- Mobile-first `p-4 sm:p-6` padding pattern applied consistently
- `'use client'` is well-scoped — no unnecessary client components
- shadcn Dialog and DropdownMenu used correctly in action components and forms
- Empty states are well-handled across all list pages
- Toast feedback (sonner) used on all mutations
- Tables wrapped in `overflow-x-auto` containers (minimum viable responsive)

**Critical weaknesses (what drags the score down):**

1. **Login page uses zero shadcn components** — entirely hand-styled with raw `<button>`, `<div>`, inline `<svg>`, and hardcoded `zinc-*` colors instead of theme tokens
2. **Inline SVG icons in 17 files** (23 total instances) despite hugeicons being installed and used in ui/ components — the most common violation pattern
3. **Raw `<button>` in 9 files** (20 instances) instead of `<Button>` — particularly severe in `capture-roster.tsx` (10 instances) and `settings/page.tsx` (2 instances)
4. **Raw `<input type="checkbox">` in 3 files** (4 instances) instead of installed `<Checkbox>` component — and `<Switch>` installed but never used in settings page
5. **Native `<select>` in kid-form.tsx** instead of shadcn Select (inconsistent within the same file)
6. **Custom nav bars** in both layouts use `overflow-x-auto` — 12 nav items requiring horizontal scroll on mobile is poor UX, and `sidebar` component is not installed
7. **Custom tabs** in capture-roster with no ARIA semantics or keyboard navigation
8. **Zero pagination** across the entire app — all list pages render all records
9. **Zero search/filter** on any list page
10. **Zero sortable columns** on any data table
11. **No virtualization** for large lists
12. **Mood/appetite/presence/dismissal button selectors** lack radiogroup ARIA semantics and `aria-pressed`/`aria-checked`
13. **No active nav state** — current page is never highlighted in the owner nav

The foundation is solid (shadcn components are installed, forms and tables use them in most places, responsive patterns are good), but the violations are pervasive enough in the interactive components and auth/layout layers that the "must use shadcn at all times" mandate is clearly not being enforced.

### Priority Fix Order:

1. Replace all 23 inline SVGs with hugeicons components (mechanical, low-risk)
2. Replace raw `<button>` with `<Button>` (login-form, logout-button, settings, capture-roster, csv-import)
3. Install `sidebar` and refactor both layouts
4. Install `tabs` and refactor capture-roster Pass 1/Pass 2
5. Replace raw checkbox/switch with shadcn Checkbox/Switch
6. Add pagination to kid/guardian/session lists
7. Add ARIA radiogroup semantics to capture-roster selectors
