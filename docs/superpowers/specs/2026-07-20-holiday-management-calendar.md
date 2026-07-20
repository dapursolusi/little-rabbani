# Holiday Management + reui Calendar Surface

**Issue:** #34
**Parent:** #32 (Calendar-Date Anchor: replace termSession with sessionType + holiday, ADR 0007)
**Status:** Design Approved

## Problem

Closures are stored as `termSession` rows with `is_holiday=true` — the absence of class as presence, duplicated per day. A 5-day Eid closure is 5 rows. This slice replaces that with a ranged Holiday event log and the calendar surface that makes date navigation primary.

## Solution

1. New `holiday` table (ranged event log, optional term scope)
2. New `src/features/holiday/` feature module (CRUD actions, Zod schema, types, fields)
3. Reui Calendar wrapper at `src/components/reui/calendar.tsx` integrated into the schedule view
4. Pure functions: `holidayRangeOverlap` + `isSchoolDay`

## Data Model

```sql
holiday
  ├── id (uuid PK, defaultRandom)
  ├── termId (uuid, nullable, FK→term ON DELETE cascade) — null = global
  ├── startDate (date, not null)
  ├── endDate (date, not null) — start <= end; single-day when equal
  ├── reason (text, not null)
  ├── source ('manual' | 'synced', pgEnum)
  ├── scope ('national' | 'custom' | 'term', pgEnum)
  ├── createdAt, updatedAt, deletedAt
  └── UNIQUE(termId, startDate, endDate, reason, source) NULLS DISTINCT
```

## Architecture

```
src/app/dashboard/owner/schedule/[termId]/page.tsx
  └── schedule-view.tsx (new wrapper)
        ├── reui/calendar.tsx — Month grid with holiday overlay
        │     ├── greyedPast modifier (date < today → CSS)
        │     ├── hasHoliday modifier (overlapping holiday → badge)
        │     └── onDayClick → day-event-list dialog
        ├── holiday-create-dialog.tsx — Create ranged holiday
        └── session-schedule-editor.tsx (existing, unchanged)

src/features/holiday/
  ├── types.ts
  ├── schema.ts  (HolidayFormSchema — Zod)
  ├── fields.ts  (DefaultFormFields-compatible)
  ├── actions.ts (CRUD server actions, gated by requireOwner)
  └── components/
        └── holiday-form.tsx (create/edit form)
```

## File Changes

| File                                                 | Action                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `src/lib/db/schema.ts`                               | Add `holiday` table, enums, relations                        |
| `src/features/holiday/types.ts`                      | Create — `Holiday` interface                                 |
| `src/features/holiday/schema.ts`                     | Create — Zod schema with ranged validation                   |
| `src/features/holiday/fields.ts`                     | Create — form field configs                                  |
| `src/features/holiday/actions.ts`                    | Create — CRUD server actions                                 |
| `src/features/holiday/components/holiday-form.tsx`   | Create — form component                                      |
| `src/components/reui/calendar.tsx`                   | Create — reui Calendar wrapper (bunx shadcn add)             |
| `src/components/sections/schedule-view.tsx`          | Create — schedule page wrapper integrating calendar + editor |
| `src/app/dashboard/owner/schedule/[termId]/page.tsx` | Modify — wrap with schedule-view                             |
| `src/lib/holiday-range-overlap.ts`                   | Create — pure function                                       |
| `src/lib/is-school-day.ts`                           | Create — pure function                                       |
| `tests/lib/holiday-range-overlap.test.ts`            | Create — unit tests                                          |
| `tests/lib/is-school-day.test.ts`                    | Create — unit tests                                          |

## Server Actions

All gated by `requireOwner()` (teachers cannot mutate holidays):

- `getHolidays(termId?: string)` — fetch holidays; if termId provided, filter to that term + global (termId null)
- `createHoliday(input)` — create ranged holiday; validate startDate <= endDate via Zod refinements
- `deleteHoliday(id)` — soft delete (set deletedAt)

## Pure Functions

### holidayRangeOverlap

```typescript
export function holidayRangeOverlap(
  date: string,
  holidays: Array<{ startDate: string; endDate: string }>
): boolean {
  const d = new Date(date);
  return holidays.some(
    (h) => d >= new Date(h.startDate) && d <= new Date(h.endDate)
  );
}
```

### isSchoolDay

```typescript
export function isSchoolDay(
  date: string,
  term: { startDate: string; endDate: string },
  holidays: Array<{ startDate: string; endDate: string }>,
  activeSessionTypes: Array<unknown>
): boolean {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 0 || day === 6) return false; // weekend
  if (d < new Date(term.startDate) || d > new Date(term.endDate)) return false; // out of term
  if (holidayRangeOverlap(date, holidays)) return false; // holiday closure
  if (activeSessionTypes.length === 0) return false; // no active block
  return true;
}
```

## Calendar UI Detail

- **Install**: `bunx --bun shadcn@latest add @reui/c-calendar-22` → copies to `src/components/reui/`
- **Greyed past**: react-day-picker `modifier` on `date < today` → CSS class `text-muted-foreground opacity-50 pointer-events-none`
- **Holiday badge**: react-day-picker `modifier` on overlapping holiday dates → custom CSS with a small badge/glyph
- **Day click**: opens a dialog (shadcn Dialog) listing that date's overlapping holidays with individual delete buttons
- **Create**: "Add Holiday" button → dialog with form (reason, date range, scope, optional term)

## Edge Cases

- **startDate > endDate**: Zod refinement rejects; toast error
- **Global + term holiday same date**: two rows coexist; both surface in day list
- **Sync near-duplicate**: NULLS DISTINCT allows it; badge count surfaces visibly; merge is v2
- **Date range spans beyond term**: allowed (global holidays); scope field disambiguates
- **React Compiler stale UI**: stable date picker state may cache — mirror controller state into React state per AGENTS.md gotcha
- **Teacher mutation**: `requireOwner()` blocks at action level

## Dependencies

- #33 (Session Type management) — closed; resolver available for school-day function
- No external packages beyond reui Calendar via shadcn registry

## Acceptance Criteria

- [ ] Owner can create a ranged Holiday (global or term-scoped); calendar shows the full range closed
- [ ] A 5-day Eid closure is persisted as ONE record (row count = 1, not 5)
- [ ] Multiple events on same date coexist; clicking the date lists each; each individually deleteable
- [ ] Calendar greys past days (date < today) via CSS modifier — zero data writes
- [ ] "Is date X a holiday?" resolves via range-overlap (EXISTS row WHERE date BETWEEN start AND end)
- [ ] "Is date X a school day?" derives correctly: weekday ∧ in-term ∧ no holiday ∧ ≥1 active sessionType
- [ ] reui Calendar files live in `src/components/reui/` — never inside `src/components/ui/`
- [ ] Unit tests pass: holiday-overlap + school-day pure functions
- [ ] `bun typecheck` + `bun lint` pass
- [ ] No console errors

## Out of Scope (v2)

- Duplicate-event merge UI
- Indonesian holiday sync automation
- Capture-table re-keys (#35–#39)
