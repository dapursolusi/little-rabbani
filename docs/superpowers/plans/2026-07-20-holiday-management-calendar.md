# Holiday Management + Calendar Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace boolean `isHoliday` on termSession with a ranged Holiday event log and integrate a reui Calendar surface into the schedule view.

**Architecture:** New `holiday` Drizzle table + `src/features/holiday/` CRUD module + reui Calendar wrapper at `src/components/reui/calendar.tsx` integrated into the schedule view. Pure functions for range overlap and school-day derivation.

**Tech Stack:** Drizzle ORM, Next.js Server Actions, shadcn/ui (Dialog, Button), reui Calendar (wraps react-day-picker), Zod, Vitest, sonner toasts.

## Global Constraints

- All mutations gated by `requireOwner()` — teachers cannot mutate holidays
- Toast (sonner) on all user-facing mutations (create, delete)
- reui Calendar files live in `src/components/reui/` — never inside `src/components/ui/`
- Soft delete (`deletedAt`) on holiday table, not hard delete
- Zod schema enforces `startDate <= endDate` via `.refine()`
- React Compiler is ON — mirror stable controller state into React state per AGENTS.md gotcha
- Existing `session-schedule-editor.tsx` is **unchanged** — only the parent page layout adds the calendar
- All text in Indonesian (UI labels, error messages, toast messages)

---

### Task 1: Holiday DB Table + Enums + Relations

**Files:**

- Modify: `src/lib/db/schema.ts`

**Interfaces:**

- Produces: `holiday` table with `holidaySourceEnum`, `holidayScopeEnum`

- [ ] **Step 1: Add enums and holiday table to schema.ts**

Add after the `activity` table section in `src/lib/db/schema.ts`:

```typescript
export const holidaySourceEnum = pgEnum('holiday_source', ['manual', 'synced']);
export const holidayScopeEnum = pgEnum('holiday_scope', [
  'national',
  'custom',
  'term',
]);

export const holiday = pgTable(
  'holiday',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    termId: uuid('term_id').references(() => term.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    reason: text('reason').notNull(),
    source: holidaySourceEnum('source').notNull().default('manual'),
    scope: holidayScopeEnum('scope').notNull().default('custom'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    uniqueHoliday: unique('holiday_unique').on(
      table.termId,
      table.startDate,
      table.endDate,
      table.reason,
      table.source
    ),
  })
);
```

- [ ] **Step 2: Add holiday relations**

```typescript
export const holidayRelations = relations(holiday, ({ one }) => ({
  term: one(term, {
    fields: [holiday.termId],
    references: [term.id],
  }),
}));
```

- [ ] **Step 3: Run typecheck and commit**

```bash
bun typecheck
git add src/lib/db/schema.ts
git commit -m "feat(db): add holiday table with enums and relations"
```

---

### Task 2: Holiday Feature Module (Types + Schema + Fields)

**Files:**

- Create: `src/features/holiday/types.ts`
- Create: `src/features/holiday/schema.ts`
- Create: `src/features/holiday/fields.ts`
- Modify: `src/components/shared/form/schema-registry.ts`

**Depends on:** Task 1 (holiday table types)

- [ ] **Step 1: Create holiday types**

```typescript
import { BaseDataResponse } from '@/types';

export interface Holiday extends BaseDataResponse {
  termId: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  source: 'manual' | 'synced';
  scope: 'national' | 'custom' | 'term';
}
```

- [ ] **Step 2: Create holiday Zod schema**

```typescript
import z from 'zod';

const HolidayFormSchema = z
  .object({
    termId: z.string().optional(),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
    reason: z.string().min(1, 'Alasan libur wajib diisi'),
    scope: z.enum(['national', 'custom', 'term']).default('custom'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai',
    path: ['endDate'],
  });

export { HolidayFormSchema };
export type HolidayFormData = z.infer<typeof HolidayFormSchema>;
```

- [ ] **Step 3: Create holiday fields**

```typescript
import type { FormField } from '@/types/field';

export const holidayFields = (): FormField[] => [
  {
    name: 'reason',
    label: 'Alasan Libur',
    type: 'text',
    required: true,
  },
  {
    name: 'startDate',
    label: 'Tanggal Mulai',
    type: 'date',
    required: true,
  },
  {
    name: 'endDate',
    label: 'Tanggal Selesai',
    type: 'date',
    required: true,
  },
  {
    name: 'scope',
    label: 'Cakupan',
    type: 'select',
    options: [
      { label: 'Nasional', value: 'national' },
      { label: 'Kustom', value: 'custom' },
      { label: 'Term', value: 'term' },
    ],
    required: true,
  },
];
```

- [ ] **Step 4: Register in schema-registry.ts**

Add to the `schemas` record:

```typescript
import { HolidayFormSchema } from '@/features/holiday/schema';

const schemas = {
  // ...existing
  holiday: HolidayFormSchema,
} as const satisfies Record<string, z.ZodObject<z.ZodRawShape>>;
```

- [ ] **Step 5: Commit**

```bash
git add src/features/holiday/ src/components/shared/form/schema-registry.ts
git commit -m "feat(holiday): add types, schema, fields, and registry"
```

---

### Task 3: Holiday Server Actions (CRUD)

**Files:**

- Create: `src/features/holiday/actions.ts`

**Depends on:** Task 1 (holiday table), Task 2 (HolidayFormSchema)

- [ ] **Step 1: Create holiday actions**

```typescript
'use server';

import { HolidayFormSchema } from '@/features/holiday/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { holiday } from '@/lib/db/schema';

import { requireOwner } from '../../lib/actions/utils';

export async function getHolidays(termId?: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    const conditions = [isNull(holiday.deletedAt)];
    if (termId) {
      conditions.push(
        sql`(${holiday.termId} = ${termId} OR ${holiday.termId} IS NULL)`
      );
    }

    const where = and(...conditions);

    const items = await db.query.holiday.findMany({
      where,
      orderBy: (holiday, { asc }) => [asc(holiday.startDate)],
    });

    return { success: true as const, data: items };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data libur' };
  }
}

export async function createHoliday(input: Record<string, unknown>) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = HolidayFormSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newItem] = await db
      .insert(holiday)
      .values({
        termId: parsed.data.termId ?? null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        reason: parsed.data.reason,
        source: 'manual',
        scope: parsed.data.scope,
      })
      .returning();

    return { success: true as const, data: newItem };
  } catch {
    return { success: false as const, error: 'Gagal membuat hari libur' };
  }
}

export async function deleteHoliday(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    await db
      .update(holiday)
      .set({ deletedAt: new Date() })
      .where(eq(holiday.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus hari libur' };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/holiday/actions.ts
git commit -m "feat(holiday): add CRUD server actions"
```

---

### Task 4: Pure Functions — holidayRangeOverlap + isSchoolDay

**Files:**

- Create: `src/lib/holiday-range-overlap.ts`
- Create: `src/lib/is-school-day.ts`
- Create: `tests/lib/holiday-range-overlap.test.ts`
- Create: `tests/lib/is-school-day.test.ts`

**Depends on:** Nothing (pure functions, no DB)

- [ ] **Step 1: Create holidayRangeOverlap pure function**

```typescript
export function holidayRangeOverlap(
  date: string,
  holidays: Array<{ startDate: string; endDate: string }>
): boolean {
  const d = new Date(date + 'T00:00:00');
  return holidays.some((h) => {
    const start = new Date(h.startDate + 'T00:00:00');
    const end = new Date(h.endDate + 'T00:00:00');
    return d >= start && d <= end;
  });
}
```

- [ ] **Step 2: Write tests for holidayRangeOverlap**

```typescript
import { describe, expect, it } from 'vitest';

import { holidayRangeOverlap } from '@/lib/holiday-range-overlap';

describe('holidayRangeOverlap', () => {
  const holidays = [
    { startDate: '2026-07-20', endDate: '2026-07-25' },
    { startDate: '2026-08-01', endDate: '2026-08-01' },
  ];

  it('returns true for date inside range', () => {
    expect(holidayRangeOverlap('2026-07-22', holidays)).toBe(true);
  });

  it('returns true for range start date', () => {
    expect(holidayRangeOverlap('2026-07-20', holidays)).toBe(true);
  });

  it('returns true for range end date', () => {
    expect(holidayRangeOverlap('2026-07-25', holidays)).toBe(true);
  });

  it('returns true for single-day holiday', () => {
    expect(holidayRangeOverlap('2026-08-01', holidays)).toBe(true);
  });

  it('returns false for date before range', () => {
    expect(holidayRangeOverlap('2026-07-19', holidays)).toBe(false);
  });

  it('returns false for date after range', () => {
    expect(holidayRangeOverlap('2026-07-26', holidays)).toBe(false);
  });

  it('returns false for empty holidays array', () => {
    expect(holidayRangeOverlap('2026-07-22', [])).toBe(false);
  });
});
```

- [ ] **Step 3: Create isSchoolDay pure function**

```typescript
import { holidayRangeOverlap } from '@/lib/holiday-range-overlap';

export interface TermInfo {
  startDate: string;
  endDate: string;
}

export function isSchoolDay(
  date: string,
  term: TermInfo,
  holidays: Array<{ startDate: string; endDate: string }>,
  hasActiveSessionType: boolean
): boolean {
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay();

  // Weekend
  if (day === 0 || day === 6) return false;

  // Out of term
  const termStart = new Date(term.startDate + 'T00:00:00');
  const termEnd = new Date(term.endDate + 'T00:00:00');
  if (d < termStart || d > termEnd) return false;

  // Holiday closure
  if (holidayRangeOverlap(date, holidays)) return false;

  // No active session type
  if (!hasActiveSessionType) return false;

  return true;
}
```

- [ ] **Step 4: Write tests for isSchoolDay**

```typescript
import { describe, expect, it } from 'vitest';

import { isSchoolDay } from '@/lib/is-school-day';

const term = { startDate: '2026-07-01', endDate: '2026-08-31' };
const holidays = [{ startDate: '2026-07-20', endDate: '2026-07-25' }];

describe('isSchoolDay', () => {
  it('returns true for a weekday in term with no holiday and active session', () => {
    // 2026-07-01 is Wednesday
    expect(isSchoolDay('2026-07-01', term, holidays, true)).toBe(true);
  });

  it('returns false for weekend', () => {
    // 2026-07-05 is Sunday
    expect(isSchoolDay('2026-07-05', term, holidays, true)).toBe(false);
  });

  it('returns false for holiday range', () => {
    // 2026-07-22 is inside holiday range
    expect(isSchoolDay('2026-07-22', term, holidays, true)).toBe(false);
  });

  it('returns false when no active session type', () => {
    expect(isSchoolDay('2026-07-01', term, holidays, false)).toBe(false);
  });

  it('returns false for date before term start', () => {
    expect(isSchoolDay('2026-06-30', term, holidays, true)).toBe(false);
  });

  it('returns false for date after term end', () => {
    expect(isSchoolDay('2026-09-01', term, holidays, true)).toBe(false);
  });
});
```

- [ ] **Step 5: Run tests and commit**

```bash
bun test tests/lib/holiday-range-overlap.test.ts tests/lib/is-school-day.test.ts
git add src/lib/holiday-range-overlap.ts src/lib/is-school-day.ts tests/lib/
git commit -m "feat(holiday): add holidayRangeOverlap and isSchoolDay pure functions"
```

---

### Task 5: Install and Wrap reui Calendar

**Files:**

- Create: `src/components/reui/calendar.tsx`
- Run: `bunx --bun shadcn@latest add @reui/c-calendar-22`

**Depends on:** Nothing (independent UI install)

- [ ] **Step 1: Install reui Calendar**

```bash
bunx --bun shadcn@latest add @reui/c-calendar-22
```

This copies the Calendar component to `src/components/reui/calendar.tsx`.

- [ ] **Step 2: Verify the installed component exists in `src/components/reui/`**

```bash
ls -la src/components/reui/
```

- [ ] **Step 3: Commit**

```bash
git add src/components/reui/
git commit -m "feat(ui): add reui Calendar component"
```

---

### Task 6: Holiday Calendar Integration Component

**Files:**

- Create: `src/components/sections/holiday-calendar-view.tsx`
- (Dependencies: Task 4 pure functions, Task 3 actions, Task 5 reui Calendar)

**Depends on:** Tasks 1-5

- [ ] **Step 1: Create holiday calendar wrapper component**

This is a Client Component (`"use client"`) because it uses hooks (useState, useEffect) for the calendar state and holiday data.

Key behavior:

- Fetches holidays on mount via `getHolidays(termId)`
- Shows a reui Calendar with:
  - `greyedPast` modifier for dates before today
  - `hasHoliday` modifier for dates with overlapping holidays
- "Tambah Libur" button → dialog with HolidayForm
- Clicking a date with holidays → dialog listing events with per-event delete
- Holiday badge count on date cells

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/holiday-calendar-view.tsx
git commit -m "feat(holiday): add calendar view component with holiday integration"
```

---

### Task 7: Integrate Calendar into Schedule Page

**Files:**

- Modify: `src/app/dashboard/owner/schedule/[termId]/page.tsx`

**Depends on:** Task 6 (holiday-calendar-view)

- [ ] **Step 1: Modify the schedule page to include the calendar**

Wrap the existing page content with the calendar component. Keep the existing session list intact; add the calendar as a sidebar or top section.

The page already fetches `getSessions(termId)` and `getTerm(termId)`. Add `getHolidays(termId)` and pass to the calendar component.

- [ ] **Step 2: Run typecheck**

```bash
bun typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/owner/schedule/[termId]/page.tsx
git commit -m "feat(schedule): integrate holiday calendar into schedule view"
```

---

### Task 8: Final Verification + E2E Smoke

**Files:**

- Verify: all changed files

**Depends on:** Tasks 1-7

- [ ] **Step 1: Run full typecheck + lint + test suite**

```bash
bun typecheck
bun lint
bun test
```

- [ ] **Step 2: Verify no console errors, todos, or debug logs**

Grep for leftover `console.log` or `TODO` markers in new files.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final verification for holiday management feature"
```
