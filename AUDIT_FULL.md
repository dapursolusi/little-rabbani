# Full UI/UX Audit — Little Rabbani

> Sources: **UI Designer** (26 findings), **UX Researcher** (22 findings), **Frontend Developer** (14 findings)
> Duplicates deduplicated. Ranked by impact × severity.

> **VERIFIED STATE — 2026-07-10:** This audit was synthesized partly from subagent reads that predated the `shadcn-compliance` commit (`a525e6a`). Verified against the current tree, the live critical set is **7, not 9**:
>
> - **C-8 (teacher tab bar covers content)** — already shipped at `src/app/dashboard/teacher/layout.tsx:25` (`<main className="flex-1 pb-20 md:pb-0">`). Removed from scope.
> - **C-1 (data tables missing pagination)** — the owner `kid`/`guardian`/`activity` list pages already paginate inline (server-side `PAGE_SIZE=50`, `getKids({search,limit,offset})`, page links). Remaining C-1 offenders are only: **monthly report picker, quarterly report picker, teacher session picker, daily-report kid list**.
> - **C-2 (raw colors)** — verified at **~600 occurrences across ~50 files** (not "50 files" vaguely). `text-zinc-500` ×119, `text-zinc-900` ×61, `border-zinc-200` ×58, status greens/ambers/reds throughout.
> - **C-4 (orphaned shared components)** — confirmed still orphaned: `EmptyState`, `SearchInput`, `Pagination`, `getStatusBadge` each have zero importers. Built, never adopted.
> - **C-5 (native `<select>`)** — confirmed still present at `kid-form.tsx:130-145`.
> - **C-7 (broken conflict button)** — confirmed: `conflict-dialog.tsx:110-119` sends server values; `IConflictData` (`capture-offline.ts:16-32`) has no `localFields`.
> - Raw `<button>` violations (the separate `docs/shadcn-violations-audit.md` flagged 20) are **all fixed** — zero remain.
>
> See **ADR 0006** for the foundations-first sequencing that consumes this audit. The two prior audit docs (`docs/frontend-audit-report.md`, `docs/shadcn-violations-audit.md`) are line-level detail sources for the items below.

---

## CRITICAL (Must Fix)

### C-1. Data tables missing search, filter, and pagination

**Affects:** 10+ pages — session list, daily reports, monthly reports, quarterly reports, teacher capture picker
**Source:** UX Researcher C3, C4, H2, H3, H6

Every data-viewing page loads ALL records at once — no search, no date filter, no pagination. Production-ready apps need at minimum search + pagination on any list over 20 items. Specific offenders:

- **Sessions under a term** (~130 rows): one flat table, no search, no date filter
- **Daily report kid list** (30+ rows): expandable rows, no pagination or status filter
- **Monthly report picker**: all kids × all months in one grid (up to 180 items)
- **Quarterly report picker**: same pattern, repeated per term
- **Teacher session picker**: card grid, no search or date filter

**Fix:** Add server-side pagination (page size 30-50) + search bar + date-range filter to all list pages.

---

### C-2. Pervasive raw Tailwind colors instead of semantic CSS tokens

**Affects:** ~50 files across the entire codebase
**Source:** Frontend H-1, UI Designer C-4, C-6, M-5

Hardcoded `text-zinc-*`, `bg-zinc-50`, `border-zinc-*`, `bg-red-50`, `text-green-700`, etc. instead of `text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`, `bg-destructive/10`, `bg-success/10`.

| Pattern found                     | Occurrences | Should be                                                     |
| --------------------------------- | ----------- | ------------------------------------------------------------- |
| `text-zinc-900`                   | 30+         | `text-foreground`                                             |
| `text-zinc-500`                   | 25+         | `text-muted-foreground`                                       |
| `bg-zinc-50`                      | 15+         | `bg-muted` or `bg-background`                                 |
| `border-zinc-200`                 | 40+         | `border-border` (or just `border` — base layer handles color) |
| `bg-red-50` / `text-red-800`      | 8+          | `bg-destructive/10` / `text-destructive`                      |
| `bg-green-100` / `text-green-700` | 6+          | `bg-success/10` / `text-success` or brand-mint                |

**Fix:** Systematic sweep — define semantic status tokens if needed, then replace all hardcoded colors. **This is the single highest-impact change for dark mode support and theme consistency.**

---

### C-3. Emoji used as structural icons instead of Hugeicons

**Affects:** 15+ locations across the codebase
**Source:** UI Designer C-7, UX Researcher L1

Emojis used as UI chrome — `⚠️`, `✓`, `✗`, `😢😟😐😊😄`, `🔒` — instead of Hugeicons SVG icons. Emojis render inconsistently per platform, can't be styled, and are inaccessible.

| Emoji        | Location                                                 | Should be                      |
| ------------ | -------------------------------------------------------- | ------------------------------ |
| `✓`          | `get-status-badge.tsx`, 4 report clients                 | `CheckmarkCircle01Icon`        |
| `⚠️`         | `get-status-badge.tsx`, 3 report pages, 3 schedule pages | `Alert02Icon` / `WarningIcon`  |
| `😢😟😐😊😄` | `capture-roster.tsx`, 3 report clients                   | `MoodSadIcon`..`MoodHappyIcon` |
| `🔒`         | `capture-roster.tsx`                                     | `LockIcon`                     |
| `✗`          | `capture-roster.tsx`                                     | `Cancel01Icon`                 |

**Fix:** Replace all structural emojis with corresponding Hugeicons icons. Mood emojis as _data content_ (displaying a child's mood) is acceptable — but as UI chrome (lock, checkmark, warning) it's not.

---

### C-4. Shared components exist but are never imported (dead code)

**Affects:** 3 components orphaned, 7+ inline duplicates each
**Source:** UI Designer C-1, H-2; UX Researcher M1

| Component        | Defined at                    | Used anywhere? | Inline duplicates                       |
| ---------------- | ----------------------------- | -------------- | --------------------------------------- |
| `EmptyState`     | `shared/empty-state.tsx`      | ❌ Never       | 7+ pages                                |
| `Pagination`     | `shared/pagination.tsx`       | ❌ Never       | 3 pages                                 |
| `SearchInput`    | `shared/search-input.tsx`     | ❌ Never       | 3 pages (raw `<input>`)                 |
| `getStatusBadge` | `shared/get-status-badge.tsx` | ❌ Never       | 3 report pages (with slight variations) |

**Fix:** Either remove the shared components (they're dead code) or migrate all pages to use them. Recommend migrating — they're already well-built.

---

### C-5. Native `<select>` in `kid-form.tsx` instead of shadcn `Select`

**Affects:** `src/components/sections/kid-form.tsx:130-145`
**Source:** Frontend C-1, UI Designer C-3

Guardian picker uses raw `<select>` + `<option>` with a massive className string mimicking shadcn styles. The rest of the same form uses proper shadcn `Select` components (status picker, term picker).

**Fix:** Replace with `<Select>` + `<SelectTrigger>` + `<SelectContent>` + `<SelectItem>` — same pattern 60 lines below in the same file.

---

### C-6. Raw `<span>` badges bypassing `Badge` component

**Affects:** `monthly/page.tsx:49-55`, `quarterly/page.tsx:12-34`
**Source:** Frontend C-2

Two report index pages define local `getStatusBadge()` returning raw `<span>` with `rounded-full px-2.5 py-0.5 text-xs font-medium` instead of the `<Badge>` component used everywhere else.

**Fix:** Use `<Badge>` with appropriate variant, or import the shared `getStatusBadge` from `shared/get-status-badge.tsx`.

---

### C-7. "Simpan Keduanya" conflict resolution button is broken

**Affects:** `src/components/sections/conflict-dialog.tsx:101-143`
**Source:** UX Researcher C2

The button claims to keep local values but actually sends server values for mood, appetite, and presence. The `IConflictData` type doesn't store local field values, so the handler can't access them. The presence derivation from `localNotes.length > 0` is nonsense.

**Fix:** Add local field values to `IConflictData`, pass them through the handler, submit them in the FormData payload.

---

### C-8. Teacher bottom tab bar covers content on mobile

**Affects:** all teacher pages
**Source:** UX Researcher C1

Fixed bottom nav (`bottom-0`) overlays content. None of the teacher pages add `pb-16`/`pb-20` padding. The last roster items, form fields, and buttons in the capture flow are hidden behind the tab bar and unreachable.

**Fix:** Add `pb-20` to the teacher layout's main content area.

---

### C-9. Icons lacking `data-icon` attribute inside Button

**Affects:** ~15 files — all action components, quick-actions, login form, capture roster
**Source:** Frontend L-1, Frontend H-3

Hugeicons inside `<Button>` are missing `data-icon="inline-start"` / `data-icon="inline-end"`, so the button's `has-data-[icon*]:p-*` selectors don't fire. Also, explicit `h-4 w-4` classes on icons inside buttons override shadcn's size variant system.

**Fix:** Add `data-icon="inline-start"` to leading icons, `data-icon="inline-end"` to trailing icons. Remove `className="h-4 w-4"` from icons inside Button.

---

## HIGH (Should Fix Soon)

### H-1. `space-y-*` used instead of `gap-*` on flex/grid containers

**Affects:** ~20 files, 40+ occurrences — every form, most layout components, all list pages
**Source:** Frontend M-1, UI Designer H-1

`space-y-*` uses CSS adjacent-sibling selectors that don't collapse properly, break with `display: contents`, and don't work on grid. Tailwind v4 prefers `gap-*`.

**Fix:** Replace `<div className="space-y-N">` with `<div className="flex flex-col gap-N">` or `<div className="grid gap-N">`.

---

### H-2. Hardcoded `bg-[#FAF5F2]` instead of `bg-brand-canvas`

**Affects:** `teacher/layout.tsx:11`, `owner/layout.tsx:24`
**Source:** UI Designer C-2, Frontend L-2

Two layout backgrounds hardcode `#FAF5F2` instead of using `bg-brand-canvas` (defined in `globals.css`).

**Fix:** Replace with `bg-brand-canvas`.

---

### H-3. Inconsistent navigation — 3 patterns used across owner pages

**Affects:** All owner pages
**Source:** UX Researcher H5

Three patterns: `PageBreadcrumbs` component (2 pages), manual `← Kembali` links (8 pages), nothing (4 pages). Top-level master pages (kid, guardian, activity, term) have zero navigation context.

**Fix:** Add `PageBreadcrumbs` consistently to every owner page. Top-level = `Dashboard > Page`. Detail/create = full hierarchy.

---

### H-4. Card containers use raw `<div>` instead of shadcn `Card`

**Affects:** All edit/create pages, session cards, DCR session picker, daily report picker
**Source:** UI Designer H-5, L-4

```tsx
// Everywhere — raw divs:
<div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">

// Should be:
<Card><CardContent className="p-6">
```

**Fix:** Use `Card` component with semantic `bg-card` / `border-border` tokens.

---

### H-5. HTML entities (`&larr;`, `&bull;`) instead of Hugeicons icons

**Affects:** 9 back-link pages + settings page
**Source:** UI Designer H-4

`&larr; Kembali` renders as a left-arrow glyph that varies per browser. Should use `ArrowLeft01Icon` from Hugeicons.

**Fix:** Replace `&larr;` with `<HugeiconsIcon icon={ArrowLeft01Icon} />`.

---

### H-6. `getStatusBadge` duplicated 4 ways with hardcoded colors

**Affects:** `shared/get-status-badge.tsx`, `monthly/page.tsx`, `quarterly/page.tsx`, `report-client.tsx` × 3
**Source:** UX Researcher M2, UI Designer H-3

Four implementations of the same status→color mapping. All use hardcoded amber/green/purple values. The shared file isn't imported anywhere.

**Fix:** Parameterize the shared `getStatusBadge`, import it in all 3 report client files, remove inline duplicates.

---

### H-7. Search inputs lack accessible labels

**Affects:** `activity/page.tsx`, `kid/page.tsx`, `guardian/page.tsx`
**Source:** Frontend H-2

Raw `<input>` with placeholder only — no `<label>`, no `aria-label`. WCAG 4.1.2 failure. Also missing `min-h-[44px]` on the kid page search.

**Fix:** Use `SearchInput` from shared components, or add `aria-label="Cari..."` to the `<Input>`.

---

### H-8. No confirmation for "Tandai Libur" action

**Affects:** `session-actions.tsx:61-76`
**Source:** UX Researcher L6

Marking a session as holiday executes immediately with no confirmation. This affects teacher capture flows and reports downstream.

**Fix:** Add `ConfirmDialog` or undo toast with action button.

---

## MEDIUM (Should Address)

| #    | Issue                                                                      | Affects                               | Source           |
| ---- | -------------------------------------------------------------------------- | ------------------------------------- | ---------------- |
| M-1  | Duplicated `TooltipProvider` per-instance instead of once at layout level  | 4 action components                   | Frontend M-2     |
| M-2  | No loading spinner on conflict dialog buttons during save                  | `conflict-dialog.tsx`                 | UX Researcher M3 |
| M-3  | Duplicated term/session card grid patterns across 4 pages                  | dcr, session, schedule, reports pages | UI Designer M-3  |
| M-4  | Teacher tabs mobile nav reimplements tabs with raw `<nav>`+`<Link>`        | `teacher-tabs.tsx:65-87`              | UI Designer M-6  |
| M-5  | Confusing "Belum ada laporan" message — should tell user why               | `report-client.tsx`                   | UX Researcher H1 |
| M-6  | Teacher and owner layouts use different page title patterns                | both layouts                          | UI Designer M-7  |
| M-7  | `console.error` in settings page (acceptable but inconsistent)             | `push-notification-setup.tsx:143`     | Frontend L-4     |
| M-8  | `<Separator>` component available but unused — raw `border-t` used instead | pagination headers                    | Frontend H-4     |
| M-9  | Hardcoded `PAGE_SIZE = 50` with no user control                            | 3 list pages                          | UX Researcher L5 |
| M-10 | "Pass 1" / "Pass 2" terminology is internal jargon                         | `capture-roster.tsx`                  | UX Researcher L2 |

---

## LOW (Nice to Have)

| #   | Issue                                                    | Location                    |
| --- | -------------------------------------------------------- | --------------------------- |
| L-1 | Default template `page.tsx` still present (dead code)    | `app/page.tsx`              |
| L-2 | `Card` used without `CardHeader` in empty states         | 4 list pages                |
| L-3 | Redundant `hover:bg-green-100` on non-interactive badge  | `get-status-badge.tsx:22`   |
| L-4 | `SessionForm` and `SessionEditForm` ~90% duplicated code | `sections/`                 |
| L-5 | Teacher schedule polls every 7s with no user feedback    | `teacher-schedule-view.tsx` |
| L-6 | No "Start Capture" shortcut from teacher dashboard       | `teacher/page.tsx`          |
| L-7 | No per-kid missing-data indicator in report roster       | `report-client.tsx`         |
| L-8 | Dead prop params in monthly/quarterly report clients     | 2 report client files       |

---

## Summary by Priority

| Priority     | Count  | Description                                        |
| ------------ | ------ | -------------------------------------------------- |
| **Critical** | 9      | Blocks usability, accessibility, or data integrity |
| **High**     | 8      | Significant UX or code quality debt                |
| **Medium**   | 10     | Should fix in normal development cycle             |
| **Low**      | 8      | Nice-to-have polish items                          |
| **Total**    | **35** | After deduplication                                |

## Quick Wins (can fix in <30 mins each)

1. `bg-[#FAF5F2]` → `bg-brand-canvas` (2 files, 2 lines)
2. `&larr;` → `ArrowLeft01Icon` across 9 files
3. Empty parent `app/page.tsx` — dead template code
4. Add `pb-20` to teacher layout (1 line)
5. Native `<select>` → shadcn `Select` in `kid-form.tsx`
6. Remove `h-4 w-4` from Button-child icons (~15 files, but each is one line)
7. Add `data-icon` to Button icons
