# Sequential-Fill Gate — Design (#66)

> **Date:** 2026-08-06
> **Status:** Approved for implementation
> **Issue:** #66 — Sequential-fill gate: fill current term's curriculum before next term unlocks
> **Extends:** `2026-08-06-curriculum-calendar-display-design.md` (#65), `2026-08-05-curriculum-calendar-integration-design.md` (Plan 1, gate slice), ADR-0008 addendum §4
> **Depends on (shipped):** #64 workday derivation, #65 calendar curriculum display

## Summary

Curriculum authoring fills **term-by-term, in order**. If the current term's
empty workdays remain unfilled, future-term days are **blocked** on the
calendar: selecting one shows a gate message in the footer with a
jump-back-to-first-empty-day action instead of authoring CTA. Calendar events
on those days still render (they live on the exception layer and never fill a
curriculum slot). When the current term is fully filled, the next term unlocks;
when no next term exists, the owner is routed to create one first.

**Design decision (user-approved deviation):** the gate is a **pure function**
derived client-side from the existing `planView` prop — *not* a new server
action. `planView` (server-fetched in `calendar/page.tsx`, #65) already carries
every input the gate needs: per-term `positions` (workday map), `items`
(filled days), and `terms` (ranges + `isActive`). Workday math stays in the
#64 server util; #65's "one derived definition, server-side" holds. This
ships the gate with **zero new round-trips**, and the pure function is
importable by #67 (batch modal) for submit-time enforcement. If #67 later
needs it server-side, the same pure fn runs there unchanged.

## Core — pure gate function

New file `src/features/curriculum/gate.ts`:

```
buildGateState(planView, todayIso) → GateState
```

`planView` is the existing `CurriculumPlanView` from `plan-view.ts`:

```
type CurriculumPlanView = {
  terms: Array<{ id; name; startDate; endDate; isActive }>;
  positions: Record<string, number>;   // date (yyyy-MM-dd) → 1-indexed absolute workday position
  items: Record<string, Curriculum>;   // date → item at that position (filled days only)
};
```

`todayIso` is `yyyy-MM-dd` (client `format(new Date(), 'yyyy-MM-dd')` at render).

**Output** (`GateState`):

```
currentTermId: string | null
currentEmptyCount: number            // X in the gate message; 0 if none
currentFirstEmptyDate: string | null // jump-back target; first workday with no item
statusByTerm: Record<string, 'editable' | 'blocked'>
createNextTermNeeded: boolean        // current full && no term with startDate > current's
```

**Construction:**

1. `currentTermId` = earliest term in `planView.terms` whose
   `startDate <= todayIso <= endDate`; fallback (none covers today):
   `find(isActive)` → earliest term by `startDate` → `null`. Today-in-gap or
   no terms → `null` (no messaging). This is the client-side equivalent of
   `findEarliestTermCoveringDate` — the server util requires a `deletedAt`
   field (`TermCoverage`) that `planView.terms` doesn't carry, so `gate.ts`
   owns a 5-line covering-date helper over `{ startDate; endDate }`.
2. **Term counts.** For each term, `empty = listTermWorkdays(...).length −
   filledCount`. term has `countEmptyWorkdays(term, holidays,
   hasActiveSessionType, filledCount)` already (server, #64) — the gate needs a
   **client-side equivalent** since it derives from `planView`, not a server
   call. Define the pure term helper in `gate.ts`:
   - `workdayCount` = number of dates in `positions` whose term is this term
     (derive term-of-date via the same covering-date check).
   - `filledCount` = those workday dates that have `items[date]`.
   - `empty = max(0, workdayCount − filledCount)`.
   (This duplicates #64's clamp but needs no DB/holiday inputs — it reads
   prepackaged workday maps from `planView`. Guest note in `gate.ts`.)
3. **Chain.** Chronological walk over terms sorted by `startDate asc`:
   - Terms at or before the *chronological position* of `current` in the
     sorted list are **always `editable`** (past terms never gate).
   - Terms after `current` are `editable` iff every term from `current` up to
     their predecessor in the sorted list is **full** (`empty === 0`). This
     implements the issue's "same check recurses" with the user-approved
     **simple chain** (block until the current term is full; then the next
     term's eligibility resolves one step at a time).
   - Otherwise `blocked`.
4. **`currentEmptyCount` / `currentFirstEmptyDate`** from the current term's
   dates: first workday date (by positions order) missing `items[date]`.
5. **`createNextTermNeeded`** = current term `empty === 0` AND no term exists
   with `startDate > current.startDate`.

**Edge cases (all no-op → existing #65 behavior preserved):** `planView` null;
today in a gap between terms; no terms at all; current term has no workdays
(no session type); a term *before* current still has empties (never gates —
past). Events untouched by every branch.

## Client wiring (`school-calendar.tsx`)

- `const gate = useMemo(() => buildGateState(planView, todayIso), [planView])`.
  `todayIso` computed once at first render (memo-safe; ignores clock drift
  within a session — accepted).
- Selected day → `selectedTerm` = the same client covering-date helper
  (`planView.terms`, `selectedIso`); `blocked = statusByTerm[selectedTerm.id]
  === 'blocked'`. The helper is exported from `gate.ts` so both the gate and
  the footer share one definition.
- **Blocked + Kurikulum mode:** the footer shows the gate item (replacing the
  #65 "Kurikulum belum diisi" authoring item for that day):
  - Copy: `belum bisa diisi — selesaikan dulu term aktif (X hari kurikulum
    belum terisi)` (X = `currentEmptyCount`).
  - Action button: **"Lompat ke hari kosong pertama"** → `setDate(new
    Date(firstEmpty))` + `setCurrentMonth(startOfMonth(firstEmpty))`.
  - Calendar **events on that day still render** (AC) — `CalendarEventList` is
    after this branch and untouched.
- **`createNextTermNeeded` (day-independent):** footer shows a notice alongside
  the curriculum section (only when Kurikulum mode shows): `Kurikulum term ini
  sudah lengkap — buat term baru untuk melanjutkan`, with a
  `Link href="/dashboard/owner/term/create"` button (user-approved: existing
  term create page, zero new UI).
- **Jump requires a controlled display month:** `school-calendar.tsx` already
  tracks `currentMonth` (event-fetch window). Add `month={currentMonth}` to the
  `Calendar` props so `setCurrentMonth` from the jump actually moves the view.
  The `onMonthChange` handler already updates it; display behavior otherwise
  identical.
- Untouched: the #65 yellow tint, position pills, footer "Kurikulum belum
  diisi" for *editable* days, and the still-unwired "Isi Kurikulum" button
  (#67 wires it).

## Data flow & errors

```
calendar/page.tsx (server)      — planView + holidays props (already #65)
  → SchoolCalendar (client)     — planView → buildGateState(client memo)
  → buildGateState → footer state (blocked | editable | createNextTerm)
```

`getCurriculumPlanView` failure → `planView = null` → gate no-op → today's view
with no messaging (existing behavior; no crash). No gate path throws: all
lookups are `?? null`/`[]` guarded.

## Files changed

| File | Action |
|------|--------|
| `src/features/curriculum/gate.ts` | New — `buildGateState`, term-empty helper |
| `src/components/sections/school-calendar.tsx` | Gate state, blocked-footer item, create-next-term notice, `month` prop, jump action |
| `tests/features/curriculum/gate.test.ts` | New — gate unit tests |

## Testing

`tests/features/curriculum/gate.test.ts`, mirroring `plan-view.test.ts` fixtures
(2026-08-03 = Monday):

- Current term with empties → its future terms `blocked`; `currentEmptyCount`
  and `currentFirstEmptyDate` correct.
- Current full → next term `editable`; the "recurse" step: fill next → the one
  after unlocks.
- Current full + no later term → `createNextTermNeeded = true` + jump null.
- Past term with empties does **not** block future terms.
- Today in a gap / no terms / `planView = null` → no-op (`currentTermId` null,
  no blocked entries).
- Blocked day keeps an entry in `items`-absent path (i.e., exists as a workday
  with a `positions` entry but no `items` entry → still present in event
  rendering input — verified by `items` untouched).

Then `bun typecheck` + `bun lint`; existing workdays + plan-view tests pass.

## Scope boundary

| In #66 | Out (#67) |
|--------|-----------|
| Gate state derivation (pure fn) | Batch modal wiring |
| Blocked-term messaging + jump-back | Upsert / diff-confirm |
| Create-next-term routing | Preset selector / date-labeled rows |
| Controlled display month for jump | Gate enforcement inside the modal's submit |

Copy on the gate message is trivial (per issue AC) — adjusted in place, no
spec change. No schema change, no migration, no new deps.
