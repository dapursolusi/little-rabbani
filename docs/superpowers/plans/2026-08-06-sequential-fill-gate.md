# Sequential-Fill Gate Implementation Plan (#66)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block curriculum authoring on future-term days until the current term's empty workdays are filled, with a jump-back-to-first-empty-day action and a create-next-term route when the current term is full with no successor.

**Architecture:** A pure client-side gate function (`buildGateState`) derives term statuses from the existing `planView` prop (already server-fetched by `calendar/page.tsx`, #65) — no new server action, zero extra round-trips. `school-calendar.tsx` consumes the gate to swap the footer state on blocked days, jump the calendar to the first empty workday, and surface a create-next-term notice. The pure function is reusable by #67 for submit-time enforcement.

**Tech Stack:** Next.js App Router, React 19 (React Compiler ON — `reactCompiler: true`), TypeScript strict, Vitest, Tailwind v4, shadcn/ui (base-nova), date-fns. Run commands with `bun run`, never `npm`/`npx`.

## Global Constraints

- **No new server action.** The gate derives entirely from the `planView` prop — workday math stays in the #64 server util (`src/features/term/workdays.ts`); do not add `getCurriculumGate()` or query the DB.
- **React Compiler is ON.** Derive all gate UI values from the memoized `gate` object, not from a stable handle hiding mutable state. `useMemo` deps must list `planView`/`todayIso` correctly.
- **Bun only:** `bun run test:run`, `bun run typecheck`, `bun run lint`. No `npm`/`npx`.
- **No `console.log`** in production code — use `console.warn`/`console.error` only.
- **No `any` types** — use `unknown` or a proper interface.
- **shadcn components only** (`Item`, `Button`, `Link` via `render`). Do not edit `src/components/ui/`.
- **Copy (trivial, per issue):** blocked = `Belum bisa diisi — selesaikan dulu term aktif (X hari kurikulum belum terisi)`; button = `Lompat ke hari kosong pertama`; create-next notice = `Kurikulum term ini sudah lengkap — buat term baru untuk melanjutkan.`; button = `Buat Term Baru`.
- **`docs/superpowers/` is gitignored** — when committing the plan/spec, `git add -f`. Source files (`src/`, `tests/`) use normal `git add`.
- `bun run typecheck` + `bun run lint` must pass with no console errors (AC).
- No schema change, no migration, no new deps.

---

### Task 1: Pure gate function — `gate.ts` + unit tests

**Files:**
- Create: `src/features/curriculum/gate.ts`
- Create: `tests/features/curriculum/gate.test.ts`

**Interfaces:**
- Consumes: `CurriculumPlanView` type from `@/features/curriculum/plan-view` (`{ terms: Array<{ id; name; startDate; endDate; isActive }>; positions: Record<string, number>; items: Record<string, Curriculum> }`); `Curriculum` from `@/features/curriculum/types`; `buildPlanView` from `@/features/curriculum/plan-view` (test fixture helper).
- Produces (Task 2 relies on these exact names/signatures):
  - `export type TermStatus = 'editable' | 'blocked'`
  - `export type GateState = { currentTermId: string | null; currentEmptyCount: number; currentFirstEmptyDate: string | null; statusByTerm: Record<string, TermStatus>; createNextTermNeeded: boolean }`
  - `export const EMPTY_GATE: GateState`
  - `export function findCoveringTerm(terms: Array<{ id: string; startDate: string; endDate: string }>, iso: string): { id: string } | null` — earliest sorted term whose `[startDate, endDate]` covers `iso`.
  - `export function buildGateState(planView: CurriculumPlanView | null, todayIso: string): GateState`

- [ ] **Step 1: Write the failing test**

Create `tests/features/curriculum/gate.test.ts`:

```ts
import { buildPlanView } from '@/features/curriculum/plan-view';
import type { Curriculum } from '@/features/curriculum/types';
import {
  buildGateState,
  EMPTY_GATE,
  findCoveringTerm,
} from '@/features/curriculum/gate';
import { describe, expect, it } from 'vitest';

// 2026-08-03 is Monday; 2026-08-07 Friday; no holidays in fixtures.
const T1 = {
  id: 't1',
  name: 'Term 1',
  startDate: '2026-08-03',
  endDate: '2026-08-07',
  isActive: true,
};
const T2 = {
  id: 't2',
  name: 'Term 2',
  startDate: '2026-08-10',
  endDate: '2026-08-14',
  isActive: false,
};
const T3 = {
  id: 't3',
  name: 'Term 3',
  startDate: '2026-08-17',
  endDate: '2026-08-21',
  isActive: false,
};

const ITEM = (sortOrder: number): Curriculum => ({
  id: `c${sortOrder}`,
  termId: 't1',
  sortOrder,
  subThemeId: 'st1',
  name: `Aktivitas ${sortOrder}`,
  objective: null,
  indoor: false,
  itemsToBring: null,
  createdAt: new Date('2026-08-01'),
  updatedAt: new Date('2026-08-01'),
  subTheme: { id: 'st1', name: 'Binatang', theme: { name: 'Alam' } },
});

// t1 workdays: Mon03 Tue04 Wed05 Thu06 Fri07 (positions 1-5).
const VIEW = (curriculumByTerm: Record<string, Curriculum[]>) =>
  buildPlanView({
    terms: [T1, T2, T3],
    holidays: [],
    hasActiveSessionType: true,
    curriculumByTerm,
  });

describe('buildGateState', () => {
  it('blocks future terms while the current term has empty workdays', () => {
    // t1 has 2 of 5 workdays filled → 3 empty.
    const view = VIEW({ t1: [ITEM(0), ITEM(1)] });
    const gate = buildGateState(view, '2026-08-04'); // today inside t1

    expect(gate.currentTermId).toBe('t1');
    expect(gate.currentEmptyCount).toBe(3);
    expect(gate.currentFirstEmptyDate).toBe('2026-08-05'); // 3rd workday
    expect(gate.statusByTerm).toEqual({ t1: 'editable', t2: 'blocked', t3: 'blocked' });
    expect(gate.createNextTermNeeded).toBe(false);
  });

  it('unlocks the next term when the current term is full (recurses)', () => {
    const full = [0, 1, 2, 3, 4].map(ITEM); // t1 full
    const gate = buildGateState(VIEW({ t1: full }), '2026-08-04');

    expect(gate.currentEmptyCount).toBe(0);
    // t2 unlocked (t1 full); t3 still blocked because t2 is empty.
    expect(gate.statusByTerm).toEqual({ t1: 'editable', t2: 'editable', t3: 'blocked' });

    // Fill t2 → t3 unlocks too (same check recurses).
    const gate2 = buildGateState(
      VIEW({ t1: full, t2: [0, 1, 2, 3, 4].map(ITEM) }),
      '2026-08-04'
    );
    expect(gate2.statusByTerm.t3).toBe('editable');
  });

  it('sets createNextTermNeeded when the current term is full and no later term exists', () => {
    const view = buildPlanView({
      terms: [T1],
      holidays: [],
      hasActiveSessionType: true,
      curriculumByTerm: { t1: [0, 1, 2, 3, 4].map(ITEM) },
    });
    const gate = buildGateState(view, '2026-08-04');

    expect(gate.currentEmptyCount).toBe(0);
    expect(gate.currentFirstEmptyDate).toBeNull();
    expect(gate.createNextTermNeeded).toBe(true);
    expect(gate.statusByTerm).toEqual({ t1: 'editable' });
  });

  it('does not gate future terms on a past term with empties', () => {
    // Past term A (July) is empty; today is inside B (August).
    const view = buildPlanView({
      terms: [
        { id: 'ta', name: 'Past', startDate: '2026-07-06', endDate: '2026-07-10', isActive: false },
        { id: 'tb', name: 'Current', startDate: '2026-08-03', endDate: '2026-08-07', isActive: true },
      ],
      holidays: [],
      hasActiveSessionType: true,
      curriculumByTerm: {}, // both empty
    });
    const gate = buildGateState(view, '2026-08-04');

    expect(gate.currentTermId).toBe('tb');
    expect(gate.statusByTerm).toEqual({ ta: 'editable', tb: 'editable' });
  });

  it('falls back to the active term when today is in a gap', () => {
    const view = buildPlanView({
      terms: [
        { ...T1, isActive: false }, // ends 08-07
        { ...T2, isActive: true }, // starts 08-10
      ],
      holidays: [],
      hasActiveSessionType: true,
      curriculumByTerm: {},
    });
    // 08-08 is in the gap between T1 (ends 08-07) and T2 (starts 08-10).
    const gate = buildGateState(view, '2026-08-08');
    expect(gate.currentTermId).toBe('t2'); // active fallback
  });

  it('returns EMPTY_GATE for a null planView or when no workdays exist', () => {
    expect(buildGateState(null, '2026-08-04')).toBe(EMPTY_GATE);
    // No active session type → zero workdays → no gate.
    const emptyView = buildPlanView({
      terms: [T1],
      holidays: [],
      hasActiveSessionType: false,
      curriculumByTerm: {},
    });
    expect(buildGateState(emptyView, '2026-08-04')).toBe(EMPTY_GATE);
  });
});

describe('findCoveringTerm', () => {
  it('returns the term whose date range covers the iso', () => {
    expect(findCoveringTerm([T1, T2], '2026-08-04')?.id).toBe('t1');
    expect(findCoveringTerm([T1, T2], '2026-08-11')?.id).toBe('t2');
    expect(findCoveringTerm([T1, T2], '2026-08-08')?.id).toBeNull(); // gap
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test:run tests/features/curriculum/gate.test.ts`
Expected: FAIL — module `@/features/curriculum/gate` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/curriculum/gate.ts`:

```ts
import type { CurriculumPlanView } from '@/features/curriculum/plan-view';

export type TermStatus = 'editable' | 'blocked';

export type GateState = {
  currentTermId: string | null;
  currentEmptyCount: number;
  currentFirstEmptyDate: string | null;
  statusByTerm: Record<string, TermStatus>;
  createNextTermNeeded: boolean;
};

export const EMPTY_GATE: GateState = {
  currentTermId: null,
  currentEmptyCount: 0,
  currentFirstEmptyDate: null,
  statusByTerm: {},
  createNextTermNeeded: false,
};

/** Earliest sorted term whose [startDate, endDate] covers iso; null if none. */
export function findCoveringTerm(
  terms: Array<{ id: string; startDate: string; endDate: string }>,
  iso: string
): { id: string } | null {
  const sorted = [...terms].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
  return sorted.find((t) => t.startDate <= iso && iso <= t.endDate) ?? null;
}

function termCovers(
  term: { startDate: string; endDate: string },
  iso: string
): boolean {
  return term.startDate <= iso && iso <= term.endDate;
}

export function buildGateState(
  planView: CurriculumPlanView | null,
  todayIso: string
): GateState {
  if (!planView || Object.keys(planView.positions).length === 0) {
    return EMPTY_GATE;
  }

  const terms = [...planView.terms].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  // Group workday dates per term — positions already encode the #64 workday map.
  const workdaysByTerm: Record<string, string[]> = {};
  for (const iso of Object.keys(planView.positions)) {
    const term = terms.find((t) => termCovers(t, iso));
    if (term) {
      (workdaysByTerm[term.id] ??= []).push(iso);
    }
  }

  const emptyByTerm: Record<string, number> = {};
  for (const t of terms) {
    const workdays = (workdaysByTerm[t.id] ?? []).sort((a, b) =>
      a.localeCompare(b)
    );
    const filled = workdays.filter((iso) => planView.items[iso]).length;
    emptyByTerm[t.id] = Math.max(0, workdays.length - filled);
  }

  // Resolve current term: covering today → active → earliest → none.
  const covering = findCoveringTerm(terms, todayIso);
  const active = terms.find((t) => t.isActive);
  const currentTermId =
    covering?.id ?? active?.id ?? (terms[0] ? terms[0].id : null);

  if (!currentTermId) return EMPTY_GATE;

  const currentIndex = terms.findIndex((t) => t.id === currentTermId);

  const statusByTerm: Record<string, TermStatus> = {};
  for (let i = 0; i < terms.length; i++) {
    if (i <= currentIndex) {
      statusByTerm[terms[i].id] = 'editable';
      continue;
    }
    // Future term is editable iff every term from current up to its
    // predecessor is full (the issue's "same check recurses").
    let allFull = true;
    for (let j = currentIndex; j < i; j++) {
      if (emptyByTerm[terms[j].id] > 0) {
        allFull = false;
        break;
      }
    }
    statusByTerm[terms[i].id] = allFull ? 'editable' : 'blocked';
  }

  const currentEmpty = emptyByTerm[currentTermId] ?? 0;
  const currentFirstEmptyDate =
    (workdaysByTerm[currentTermId] ?? [])
      .sort((a, b) => a.localeCompare(b))
      .find((iso) => !planView.items[iso]) ?? null;

  const isLastTerm = currentIndex === terms.length - 1;
  const createNextTermNeeded = currentEmpty === 0 && isLastTerm;

  return {
    currentTermId,
    currentEmptyCount: currentEmpty,
    currentFirstEmptyDate,
    statusByTerm,
    createNextTermNeeded,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test:run tests/features/curriculum/gate.test.ts`
Expected: PASS — all `describe`/`it` blocks green.

- [ ] **Step 5: Run existing suites to confirm no regression**

Run: `bun run test:run tests/features/curriculum/ tests/features/term/`
Expected: PASS — `plan-view.test.ts`, `workdays.test.ts` still green.

- [ ] **Step 6: Commit**

```bash
git add src/features/curriculum/gate.ts tests/features/curriculum/gate.test.ts
git commit -m "feat(#66): sequential-fill gate derivation (pure, from planView)"
```

---

### Task 2: Gate wiring in the calendar footer — `school-calendar.tsx`

**Files:**
- Modify: `src/components/sections/school-calendar.tsx`

**Interfaces:**
- Consumes: `buildGateState`, `findCoveringTerm` from `@/features/curriculum/gate` (Task 1). Existing props: `planView?: CurriculumPlanView | null`, `holidays?: Holiday[]`. Existing state: `date`, `currentMonth`, `showCurriculums`.
- Produces: `gate` memo, `selectedBlocked`, `jumpToFirstEmpty()` (calls `setDate` + `setCurrentMonth`), and the `month={currentMonth}` prop on `Calendar`. No new component; no new fetch.

- [ ] **Step 1: Add imports and gate state**

Add to the import block at the top of `src/components/sections/school-calendar.tsx`:

```ts
import { buildGateState, findCoveringTerm } from '@/features/curriculum/gate';
```

Inside the `SchoolCalendar` component, after the existing state declarations (`date`, `currentMonth`, `eventDates`, `showCurriculums`), add:

```ts
const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
const gate = useMemo(() => buildGateState(planView, todayIso), [planView, todayIso]);
```

- [ ] **Step 2: Make the display month controlled (for jump navigation)**

In the `<Calendar ...>` JSX (around line 281), add `month={currentMonth}` so `setCurrentMonth` from the jump actually moves the view:

```tsx
<Calendar
  key={`calendar-${holidays.length}`}
  month={currentMonth}
  mode="single"
  ...
```

The existing `onMonthChange={handleMonthChange}` already keeps `currentMonth` current — display behavior is otherwise unchanged.

- [ ] **Step 3: Compute the selected day's blocked state**

Near the existing derived values (`selectedIso`, `selectedPosition`, `selectedItem`, `isSelectedWorkday`, ~line 262), add:

```ts
const selectedTerm = findCoveringTerm(planView?.terms ?? [], selectedIso);
const selectedBlocked =
  !!selectedTerm && gate.statusByTerm[selectedTerm.id] === 'blocked';
```

- [ ] **Step 4: Add the jump handler**

After `handleMonthChange` (~line 273), add:

```ts
const jumpToFirstEmpty = () => {
  if (!gate.currentFirstEmptyDate) return;
  const target = new Date(gate.currentFirstEmptyDate + 'T00:00:00');
  setDate(target);
  setCurrentMonth(startOfMonth(target));
};
```

`format`, `startOfMonth`, `useMemo` are already imported (line 18, line 3).

- [ ] **Step 5: Replace the footer curriculum section with the gate-aware version**

Replace the existing block (currently lines 346–400):

```tsx
{showCurriculums && isSelectedWorkday && (
  <ItemGroup className="w-full gap-1!">
    <ItemSeparator />
    {selectedItem ? (
      <Item variant="outline">
        <ItemHeader>
          <Badge className="font-medium">
            {selectedItem.subTheme?.theme?.name ?? '—'}:{' '}
            {selectedItem.subTheme?.name ?? '—'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Hari {selectedPosition}
          </span>
        </ItemHeader>
        <ItemContent>
          <ItemTitle>{selectedItem.name}</ItemTitle>
          <ItemDescription className="flex flex-col gap-1">
            {selectedItem.objective && (
              <span className="text-xs text-muted-foreground">
                {selectedItem.objective}
              </span>
            )}
            {selectedItem.itemsToBring && (
              <span className="text-xs text-muted-foreground">
                Bawaan: {selectedItem.itemsToBring}
              </span>
            )}
          </ItemDescription>
        </ItemContent>
      </Item>
    ) : selectedBlocked ? (
      <Item variant="outline">
        <ItemHeader>
          <span className="font-semibold text-sm text-muted-foreground">
            Belum bisa diisi — selesaikan dulu term aktif ({gate.currentEmptyCount}{' '}
            hari kurikulum belum terisi)
          </span>
        </ItemHeader>
        <ItemContent>
          <ItemDescription>
            Term berikutnya baru bisa diisi setelah term aktif terisi penuh.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" onClick={jumpToFirstEmpty}>
            Lompat ke hari kosong pertama
          </Button>
        </ItemActions>
      </Item>
    ) : (
      <Item variant="outline">
        <ItemHeader>
          <span className="font-semibold text-sm text-warning">
            Kurikulum belum diisi
          </span>
        </ItemHeader>
        <ItemContent>
          <ItemDescription>
            Hari ini belum memiliki item kurikulum.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            size="sm"
            disabled
            title="Mode massal hadir di fitur berikutnya"
          >
            Isi Kurikulum
          </Button>
        </ItemActions>
      </Item>
    )}
  </ItemGroup>
)}
{showCurriculums && gate.createNextTermNeeded && (
  <ItemGroup className="w-full gap-1!">
    <ItemSeparator />
    <Item variant="outline">
      <ItemContent>
        <ItemDescription>
          Kurikulum term ini sudah lengkap — buat term baru untuk melanjutkan.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          size="sm"
          nativeButton={false}
          render={
            <Link href="/dashboard/owner/term/create">Buat Term Baru</Link>
          }
        />
      </ItemActions>
    </Item>
  </ItemGroup>
)}
```

Notes:
- A **filled** day in a blocked term still shows its read-only detail (`selectedItem` branch first) — the gate blocks *authoring*, not reading; the "belum diisi" authoring item only appears for blocked **unfilled** days.
- The `createNextTermNeeded` notice is **day-independent** and appears whenever Kurikulum mode is on and the current term is full with no later term.
- `CalendarEventList` (line 442) is untouched — events still render on blocked days (AC).
- The still-unwired "Isi Kurikulum" button stays disabled for editable unfilled days (#67 wires it).

- [ ] **Step 6: Verify types, lint, and tests**

Run: `bun run typecheck` — Expected: PASS (no new errors).
Run: `bun run lint` — Expected: PASS.
Run: `bun run test:run` — Expected: PASS (all suites).

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/school-calendar.tsx
git commit -m "feat(#66): gate messaging + jump-back + create-next-term in calendar footer"
```

---

### Task 3: Manual smoke check (visual verification)

**Files:** none (run the app).

**Interfaces:** consumes Tasks 1–2.

- [ ] **Step 1: Start the app**

Run: `bun run dev` (port 3000 must be free; kill stale Next.js procs first).

- [ ] **Step 2: Verify gate behavior**

Open `/dashboard/owner/calendar` as owner and toggle **Kurikulum**:
- Current term with empty workdays → selecting a future-term workday shows the blocked message with the remaining count; **Lompat ke hari kosong pertama** navigates to the current term's first empty day.
- Filled days on a blocked term still show their item detail; events/holidays still render.
- Current term fully filled + no later term → the create-next-term notice appears with a link to `/dashboard/owner/term/create`.
- Toggle Kurikulum off → no gate UI (existing behavior).

Expected: all of the above, no console errors.

- [ ] **Step 3: Commit any console-error fixes** (if found during smoke check)

```bash
git add -A src/
git commit -m "fix(#66): console-error cleanup from smoke check"
```
