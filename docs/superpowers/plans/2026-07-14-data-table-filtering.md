# Data Table Column Filtering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-column filtering to the `DataTable` component with a registry-based filter type system, plus a filter bar UI between the toolbar and table body.

**Architecture:** Column definitions declare filter intent in `meta.filter`. The `DataTable` reads those metas and renders a filter bar. Built-in filter types (select, text, range) are registered in a central registry; custom filters provide `component` + `filterFn` as an escape hatch. All filter state is mirrored to React `useState` (React Compiler pattern). Filters AND with the existing global search.

**Tech Stack:** React 19, TanStack Table (already installed), @hugeicons/react (already installed), Vitest + @testing-library/react (already installed)

## Global Constraints

- All filter state must be mirrored to `useState` — never read from `table.getState()` in JSX (React Compiler memoization)
- Use `meta` property on `ColumnDef` for filter configuration (same pattern as existing `meta.enableSearch`)
- Custom filter `component` must be accompanied by `filterFn` — TypeScript enforces this via `ICustomFilter` requiring both
- Filter bar only renders when at least one column has `meta.filter`
- Filters use AND logic with the existing `globalFilter`
- Use `FilterAddIcon` for the "+ Filter" button, `FilterRemoveIcon` for pill removal
- Built-in filter options auto-derive distinct values from table data when not explicitly provided

---

### Task 1: Filter types

**Files:**

- Create: `src/components/shared/table/filters/types.ts`

**Interfaces:**

- Produces: `IFilterComponentProps`, `IRegistryFilter`, `ICustomFilter`, `TColumnFilter`

- [ ] **Step 1: Write the types file**

```ts
// src/components/shared/table/filters/types.ts
import type { ComponentType, FilterFn } from '@tanstack/react-table';

export interface IFilterComponentProps {
  value: unknown;
  onChange: (value: unknown) => void;
  /** pre-computed options for select/multi-select (auto-derived or explicit) */
  options?: { label: string; value: string }[];
}

export interface IRegistryFilter {
  type: 'select' | 'multi-select' | 'text' | 'range' | 'boolean';
  /** Override pill label. Falls back to column meta.title. */
  title?: string;
  /** Explicit options for select/multi-select. Auto-derived from data if omitted. */
  options?: { label: string; value: string }[];
  /** range: minimum allowed value */
  min?: number;
  /** range: maximum allowed value */
  max?: number;
}

export interface ICustomFilter<TData = unknown> {
  component: ComponentType<IFilterComponentProps>;
  filterFn: FilterFn<TData>;
  title?: string;
}

export type TColumnFilter = IRegistryFilter | ICustomFilter<unknown>;

/** Shape of a range filter value */
export interface IRangeValue {
  min?: number;
  max?: number;
}
```

- [ ] **Step 2: Verify file structure**

```bash
ls src/components/shared/table/filters/types.ts
```

Expected: file exists.

- [ ] **Step 3: Typecheck**

```bash
bun run typecheck --noEmit 2>&1 | head -20
```

Expected: no new errors (only existing project errors, if any).

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/table/filters/types.ts
git commit -m "feat(table): add filter types for column-meta-driven filtering"
```

---

### Task 2: Filter registry

**Files:**

- Create: `src/components/shared/table/filters/registry.ts`

**Interfaces:**

- Consumes: `IFilterComponentProps` from types.ts
- Produces: `IFilterRegistration`, `registerFilter(type, component, filterFn)`, `getFilter(type)`

- [ ] **Step 1: Write the registry file**

```ts
// src/components/shared/table/filters/registry.ts
import type { ComponentType, FilterFn } from '@tanstack/react-table';

import type { IFilterComponentProps } from './types';

export interface IFilterRegistration {
  component: ComponentType<IFilterComponentProps>;
  filterFn: FilterFn<unknown>;
}

const registry = new Map<string, IFilterRegistration>();

export function registerFilter(
  type: string,
  component: ComponentType<IFilterComponentProps>,
  filterFn: FilterFn<unknown>
): void {
  registry.set(type, { component, filterFn });
}

export function getFilter(type: string): IFilterRegistration | undefined {
  return registry.get(type);
}
```

- [ ] **Step 2: Write the test**

```ts
// tests/components/shared/table-filters-registry.test.ts
import { describe, expect, it } from 'vitest';

import {
  getFilter,
  registerFilter,
} from '@/components/shared/table/filters/registry';

const MockFilter = () => null;
function mockFilterFn() {
  return true;
}

describe('Filter registry', () => {
  it('returns undefined for unregistered type', () => {
    expect(getFilter('nonexistent')).toBeUndefined();
  });

  it('registers and retrieves a filter', () => {
    registerFilter('select', MockFilter, mockFilterFn);
    const entry = getFilter('select');
    expect(entry?.component).toBe(MockFilter);
    expect(entry?.filterFn).toBe(mockFilterFn);
  });

  it('overwrites on duplicate registration', () => {
    const NewMock = () => null;
    function newFn() {
      return false;
    }
    registerFilter('select', NewMock, newFn);
    const entry = getFilter('select');
    expect(entry?.component).toBe(NewMock);
    expect(entry?.filterFn).toBe(newFn);
  });
});
```

- [ ] **Step 3: Run the test**

```bash
bun run test:run -- tests/components/shared/table-filters-registry.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/table/filters/registry.ts tests/components/shared/table-filters-registry.test.ts
git commit -m "feat(table): add filter registry for pluggable filter types"
```

---

### Task 3: Select filter

**Files:**

- Create: `src/components/shared/table/filters/select-filter.tsx`
- Create: `tests/components/shared/table-select-filter.test.tsx`

**Interfaces:**

- Consumes: `IFilterComponentProps` from types.ts
- Produces: `SelectFilter` component, `selectFilterFn`

- [ ] **Step 1: Write the select filter component**

```tsx
// src/components/shared/table/filters/select-filter.tsx
'use client';

import type { FilterFn } from '@tanstack/react-table';

import type { IFilterComponentProps } from './types';

export function SelectFilter({
  value,
  onChange,
  options = [],
}: IFilterComponentProps) {
  return (
    <select
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="w-full min-w-[120px] rounded border border-input bg-background px-2 py-1 text-sm"
    >
      <option value="">Semua</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export const selectFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  return String(row.getValue(columnId)) === String(value);
};
```

- [ ] **Step 2: Write the test**

```tsx
// tests/components/shared/table-select-filter.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  SelectFilter,
  selectFilterFn,
} from '@/components/shared/table/filters/select-filter';

const OPTIONS = [
  { label: 'Terdaftar', value: 'enrolled' },
  { label: 'Menunggu', value: 'waiting' },
  { label: 'Alumni', value: 'alumni' },
];

describe('SelectFilter component', () => {
  it('renders options with "Semua" default', () => {
    render(
      <SelectFilter value={undefined} onChange={() => {}} options={OPTIONS} />
    );
    expect(screen.getByRole('combobox')).toBeDefined();
    expect(screen.getByText('Semua')).toBeDefined();
    expect(screen.getByText('Terdaftar')).toBeDefined();
  });

  it('calls onChange when an option is selected', () => {
    let value: unknown = undefined;
    render(
      <SelectFilter
        value={undefined}
        onChange={(v) => {
          value = v;
        }}
        options={OPTIONS}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'enrolled' },
    });
    expect(value).toBe('enrolled');
  });

  it('calls onChange with undefined when "Semua" is selected', () => {
    let value: unknown = 'enrolled';
    render(
      <SelectFilter
        value="enrolled"
        onChange={(v) => {
          value = v;
        }}
        options={OPTIONS}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '' },
    });
    expect(value).toBeUndefined();
  });
});

describe('selectFilterFn', () => {
  it('matches exact string value', () => {
    const row = { getValue: () => 'enrolled' };
    expect(selectFilterFn(row as never, 'status', 'enrolled')).toBe(true);
    expect(selectFilterFn(row as never, 'status', 'waiting')).toBe(false);
  });

  it('returns false for undefined filter value', () => {
    const row = { getValue: () => 'enrolled' };
    expect(selectFilterFn(row as never, 'status', undefined)).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
bun run test:run -- tests/components/shared/table-select-filter.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/table/filters/select-filter.tsx tests/components/shared/table-select-filter.test.tsx
git commit -m "feat(table): add select filter component with equals filterFn"
```

---

### Task 4: Text filter

**Files:**

- Create: `src/components/shared/table/filters/text-filter.tsx`

**Interfaces:**

- Consumes: `IFilterComponentProps` from types.ts
- Produces: `TextFilter` component, `textFilterFn`

- [ ] **Step 1: Write the text filter component**

```tsx
// src/components/shared/table/filters/text-filter.tsx
'use client';

import type { FilterFn } from '@tanstack/react-table';

import type { IFilterComponentProps } from './types';

export function TextFilter({ value, onChange }: IFilterComponentProps) {
  return (
    <input
      type="text"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      placeholder="Cari..."
      className="w-full min-w-[140px] rounded border border-input bg-background px-2 py-1 text-sm"
    />
  );
}

export const textFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  const cellValue = String(row.getValue(columnId) ?? '').toLowerCase();
  return cellValue.includes(String(value).toLowerCase());
};
```

- [ ] **Step 2: Write the test**

```tsx
// tests/components/shared/table-text-filter.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  TextFilter,
  textFilterFn,
} from '@/components/shared/table/filters/text-filter';

describe('TextFilter component', () => {
  it('renders an input with current value', () => {
    render(<TextFilter value="Ahmad" onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Ahmad');
  });

  it('calls onChange on input', () => {
    let value: unknown = undefined;
    render(
      <TextFilter
        value={undefined}
        onChange={(v) => {
          value = v;
        }}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test' },
    });
    expect(value).toBe('test');
  });

  it('calls onChange with undefined for empty input', () => {
    let value: unknown = 'something';
    render(
      <TextFilter
        value="something"
        onChange={(v) => {
          value = v;
        }}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    expect(value).toBeUndefined();
  });
});

describe('textFilterFn', () => {
  it('matches case-insensitive substring', () => {
    const row = { getValue: () => 'Ahmad Fauzi' };
    expect(textFilterFn(row as never, 'name', 'ahmad')).toBe(true);
    expect(textFilterFn(row as never, 'name', 'FAUZI')).toBe(true);
    expect(textFilterFn(row as never, 'name', 'Budi')).toBe(false);
  });

  it('handles null cell value', () => {
    const row = { getValue: () => null };
    expect(textFilterFn(row as never, 'name', 'test')).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
bun run test:run -- tests/components/shared/table-text-filter.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/table/filters/text-filter.tsx tests/components/shared/table-text-filter.test.tsx
git commit -m "feat(table): add text filter component with case-insensitive includes filterFn"
```

---

### Task 5: Range filter

**Files:**

- Create: `src/components/shared/table/filters/range-filter.tsx`

**Interfaces:**

- Consumes: `IFilterComponentProps`, `IRangeValue` from types.ts
- Produces: `RangeFilter` component, `rangeFilterFn`

- [ ] **Step 1: Write the range filter component**

```tsx
// src/components/shared/table/filters/range-filter.tsx
'use client';

import type { FilterFn } from '@tanstack/react-table';

import type { IFilterComponentProps, IRangeValue } from './types';

export function RangeFilter({ value, onChange }: IFilterComponentProps) {
  const range = (value as IRangeValue) ?? {};

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={range.min ?? ''}
        onChange={(e) => {
          const min =
            e.target.value !== '' ? Number(e.target.value) : undefined;
          const next: IRangeValue = { ...range, min };
          onChange(Object.keys(next).length > 0 ? next : undefined);
        }}
        placeholder="Min"
        className="w-16 rounded border border-input bg-background px-1 py-0.5 text-sm"
        aria-label="Nilai minimum"
      />
      <span className="text-xs text-muted-foreground">–</span>
      <input
        type="number"
        value={range.max ?? ''}
        onChange={(e) => {
          const max =
            e.target.value !== '' ? Number(e.target.value) : undefined;
          const next: IRangeValue = { ...range, max };
          onChange(Object.keys(next).length > 0 ? next : undefined);
        }}
        placeholder="Max"
        className="w-16 rounded border border-input bg-background px-1 py-0.5 text-sm"
        aria-label="Nilai maksimum"
      />
    </div>
  );
}

export const rangeFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  const { min, max } = value as IRangeValue;
  const cellValue = Number(row.getValue(columnId));
  if (Number.isNaN(cellValue)) return false;
  if (min !== undefined && cellValue < min) return false;
  if (max !== undefined && cellValue > max) return false;
  return true;
};
```

- [ ] **Step 2: Write the test**

```tsx
// tests/components/shared/table-range-filter.test.tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  RangeFilter,
  rangeFilterFn,
} from '@/components/shared/table/filters/range-filter';

describe('RangeFilter component', () => {
  it('renders min and max inputs', () => {
    render(<RangeFilter value={undefined} onChange={() => {}} />);
    expect(screen.getByLabelText('Nilai minimum')).toBeDefined();
    expect(screen.getByLabelText('Nilai maksimum')).toBeDefined();
  });

  it('calls onChange with range on min input', () => {
    let value: unknown = undefined;
    render(
      <RangeFilter
        value={undefined}
        onChange={(v) => {
          value = v;
        }}
      />
    );
    fireEvent.change(screen.getByLabelText('Nilai minimum'), {
      target: { value: '3' },
    });
    expect(value).toEqual({ min: 3 });
  });

  it('calls onChange with range on max input', () => {
    let value: unknown = undefined;
    render(
      <RangeFilter
        value={undefined}
        onChange={(v) => {
          value = v;
        }}
      />
    );
    fireEvent.change(screen.getByLabelText('Nilai maksimum'), {
      target: { value: '10' },
    });
    expect(value).toEqual({ max: 10 });
  });
});

describe('rangeFilterFn', () => {
  it('filters rows within range', () => {
    const row = { getValue: () => 5 };
    expect(rangeFilterFn(row as never, 'age', { min: 3, max: 7 })).toBe(true);
    expect(rangeFilterFn(row as never, 'age', { min: 6, max: 10 })).toBe(false);
    expect(rangeFilterFn(row as never, 'age', { min: 3 })).toBe(true);
    expect(rangeFilterFn(row as never, 'age', { max: 7 })).toBe(true);
  });

  it('returns false for NaN cell value', () => {
    const row = { getValue: () => 'not a number' };
    expect(rangeFilterFn(row as never, 'name', { min: 3 })).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
bun run test:run -- tests/components/shared/table-range-filter.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/table/filters/range-filter.tsx tests/components/shared/table-range-filter.test.tsx
git commit -m "feat(table): add range filter component with min/max filterFn"
```

---

### Task 6: Built-in filter registration

**Files:**

- Create: `src/components/shared/table/filters/builtins.ts`

**Interfaces:**

- Consumes: `registerFilter` from registry.ts, built-in components from select/range/text filters
- Produces: `registerBuiltinFilters()`

- [ ] **Step 1: Write the builtins file**

```ts
// src/components/shared/table/filters/builtins.ts
import { RangeFilter, rangeFilterFn } from './range-filter';
import { registerFilter } from './registry';
import { SelectFilter, selectFilterFn } from './select-filter';
import { TextFilter, textFilterFn } from './text-filter';

let registered = false;

/** Idempotent — safe to call multiple times (e.g. in DataTable render body). */
export function registerBuiltinFilters(): void {
  if (registered) return;
  registerFilter('select', SelectFilter, selectFilterFn);
  registerFilter('text', TextFilter, textFilterFn);
  registerFilter('range', RangeFilter, rangeFilterFn);
  registered = true;
}
```

- [ ] **Step 2: Write the test**

```ts
// tests/components/shared/table-builtins.test.ts
import { describe, expect, it } from 'vitest';

import { registerBuiltinFilters } from '@/components/shared/table/filters/builtins';
import { getFilter } from '@/components/shared/table/filters/registry';

describe('registerBuiltinFilters', () => {
  it('registers select, text, and range types', () => {
    registerBuiltinFilters();
    expect(getFilter('select')).toBeDefined();
    expect(getFilter('text')).toBeDefined();
    expect(getFilter('range')).toBeDefined();
  });

  it('is idempotent', () => {
    registerBuiltinFilters();
    // Should not throw, should not change state
    const select = getFilter('select');
    registerBuiltinFilters();
    expect(getFilter('select')).toBe(select);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
bun run test:run -- tests/components/shared/table-builtins.test.ts
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/table/filters/builtins.ts tests/components/shared/table-builtins.test.ts
git commit -m "feat(table): add built-in filter registration for select, text, range"
```

---

### Task 7: Filter bar component

**Files:**

- Create: `src/components/shared/table/data-table-filter-bar.tsx`
- Create: `tests/components/shared/data-table-filter-bar.test.tsx`

**Interfaces:**

- Consumes: `getFilter` from registry.ts, `TColumnFilter` from types.ts, `registerBuiltinFilters` from builtins.ts, `ColumnFiltersState` from @tanstack/react-table
- Produces: `DataTableFilterBar<TData>` component

- [ ] **Step 1: Write the filter bar component**

```tsx
// src/components/shared/table/data-table-filter-bar.tsx
'use client';

import { FilterAddIcon, FilterRemoveIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type {
  ColumnDef,
  ColumnFiltersState,
  Table,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { registerBuiltinFilters } from './filters/builtins';
import { getFilter } from './filters/registry';
import type { TColumnFilter } from './filters/types';

interface IDataTableFilterBarProps<TData> {
  table: Table<TData>;
  columns: ColumnDef<TData, unknown>[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}

/** Derive distinct values for a column from the table's row model. */
function deriveOptions<TData>(
  table: Table<TData>,
  columnId: string
): { label: string; value: string }[] {
  const values = new Set<string>();
  table.getRowModel().rows.forEach((row) => {
    const val = row.getValue(columnId);
    if (val != null) values.add(String(val));
  });
  return Array.from(values)
    .sort()
    .map((v) => ({ label: v, value: v }));
}

/** Extract filterable columns from the column definitions. */
function getFilterableColumns<TData>(columns: ColumnDef<TData, unknown>[]) {
  return columns
    .filter((col) => {
      const meta = (col as { meta?: { filter?: TColumnFilter } }).meta;
      return meta?.filter !== undefined;
    })
    .map((col) => {
      const meta = (
        col as { meta?: { filter?: TColumnFilter; title?: string } }
      ).meta!;
      const columnId =
        'id' in col && typeof col.id === 'string'
          ? col.id
          : 'accessorKey' in col && typeof col.accessorKey === 'string'
            ? col.accessorKey
            : 'unknown';
      return { columnId, title: meta.title ?? columnId, filter: meta.filter! };
    });
}

export default function DataTableFilterBar<TData>({
  table,
  columns,
  columnFilters,
  onColumnFiltersChange,
}: IDataTableFilterBarProps<TData>) {
  registerBuiltinFilters();

  const filterableColumns = getFilterableColumns(columns);

  if (filterableColumns.length === 0) return null;

  // Columns not currently active as filters
  const inactiveColumns = filterableColumns.filter(
    (col) => !columnFilters.some((f) => f.id === col.columnId)
  );

  // Active filter pills: merge columnFilters with their column metadata
  const activeFilters = columnFilters
    .map((f) => {
      const col = filterableColumns.find((c) => c.columnId === f.id);
      return col ? { id: f.id, value: f.value, column: col } : null;
    })
    .filter(Boolean) as Array<{
    id: string;
    value: unknown;
    column: { columnId: string; title: string; filter: TColumnFilter };
  }>;

  const handleSetFilter = (id: string, value: unknown) => {
    const existing = columnFilters.find((f) => f.id === id);
    if (existing) {
      onColumnFiltersChange(
        columnFilters.map((f) => (f.id === id ? { ...f, value } : f))
      );
    } else {
      onColumnFiltersChange([...columnFilters, { id, value }]);
    }
  };

  const handleRemoveFilter = (id: string) => {
    onColumnFiltersChange(columnFilters.filter((f) => f.id !== id));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap px-2 py-1">
      {inactiveColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="h-8">
                <HugeiconsIcon icon={FilterAddIcon} strokeWidth={2} />
                Filter
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            {inactiveColumns.map((col) => (
              <DropdownMenuItem
                key={col.columnId}
                onClick={() =>
                  onColumnFiltersChange([
                    ...columnFilters,
                    { id: col.columnId, value: undefined },
                  ])
                }
              >
                {col.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {activeFilters.map((af) => {
        // Resolve the filter component
        let FilterComponent: React.ComponentType<{
          value: unknown;
          onChange: (value: unknown) => void;
          options?: { label: string; value: string }[];
        }> | null = null;

        if ('type' in af.column.filter) {
          const registration = getFilter(af.column.filter.type);
          if (registration) {
            FilterComponent = registration.component;
          }
        } else {
          FilterComponent = af.column.filter.component;
        }

        // For select/multi-select: use explicit options or auto-derive from data
        let options: { label: string; value: string }[] | undefined;
        if (
          'type' in af.column.filter &&
          (af.column.filter.type === 'select' ||
            af.column.filter.type === 'multi-select')
        ) {
          options =
            af.column.filter.options ??
            deriveOptions(table, af.column.columnId);
        }

        return (
          <div
            key={af.id}
            className="flex items-center gap-1 rounded-md border bg-accent/30 px-2 py-1 text-sm"
          >
            <span className="font-medium whitespace-nowrap">
              {af.column.title}
            </span>
            {FilterComponent && (
              <FilterComponent
                value={af.value}
                onChange={(v) => handleSetFilter(af.id, v)}
                options={options}
              />
            )}
            <button
              onClick={() => handleRemoveFilter(af.id)}
              className="ml-1 rounded p-0.5 hover:bg-muted"
              aria-label={`Hapus filter ${af.column.title}`}
            >
              <HugeiconsIcon icon={FilterRemoveIcon} size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Write the test**

```tsx
// tests/components/shared/data-table-filter-bar.test.tsx
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DataTableFilterBar from '@/components/shared/table/data-table-filter-bar';
import { registerFilter } from '@/components/shared/table/filters/registry';

// Don't call registerBuiltinFilters() — invoke registerFilter directly for test isolation
const FakeSelect = ({
  value,
  onChange,
  options,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  options?: { label: string; value: string }[];
}) => (
  <select
    data-testid="fake-select"
    value={(value as string) ?? ''}
    onChange={(e) => onChange(e.target.value || undefined)}
  >
    <option value="">--</option>
    {(options ?? []).map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

registerFilter('select', FakeSelect, () => true);

type TRow = { name: string; status: string };

const columns: ColumnDef<TRow>[] = [
  { accessorKey: 'name', meta: { title: 'Nama' } },
  {
    accessorKey: 'status',
    meta: { title: 'Status', filter: { type: 'select' } },
  },
  {
    id: 'customCol',
    accessorKey: 'name',
    meta: {
      title: 'Custom',
      filter: { component: FakeSelect, filterFn: () => true },
    },
  },
];

const data: TRow[] = [
  { name: 'Ahmad', status: 'enrolled' },
  { name: 'Budi', status: 'waiting' },
];

function TestWrapper({
  columnFilters = [],
  onColumnFiltersChange = () => {},
}: {
  columnFilters?: { id: string; value: unknown }[];
  onColumnFiltersChange?: (f: typeof columnFilters) => void;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnFilters },
    onColumnFiltersChange,
  });

  return (
    <DataTableFilterBar
      table={table}
      columns={columns}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
    />
  );
}

describe('DataTableFilterBar', () => {
  it('renders "+ Filter" button when filterable columns exist', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Filter')).toBeDefined();
  });

  it('adds a filter pill when a column is selected from dropdown', () => {
    let filters: { id: string; value: unknown }[] = [];
    render(
      <TestWrapper
        columnFilters={filters}
        onColumnFiltersChange={(f) => {
          filters = f;
        }}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Filter'));
    // Click "Status" to add filter
    fireEvent.click(screen.getByText('Status'));

    expect(filters).toHaveLength(1);
    expect(filters[0].id).toBe('status');
    expect(filters[0].value).toBeUndefined();
  });

  it('renders active filter pills', () => {
    render(
      <TestWrapper columnFilters={[{ id: 'status', value: 'enrolled' }]} />
    );
    // The select component renders, pill label is "Status"
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByTestId('fake-select')).toBeDefined();
  });

  it('removes filter when X button is clicked', () => {
    let filters: { id: string; value: unknown }[] = [
      { id: 'status', value: 'enrolled' },
    ];
    render(
      <TestWrapper
        columnFilters={filters}
        onColumnFiltersChange={(f) => {
          filters = f;
        }}
      />
    );

    fireEvent.click(screen.getByLabelText('Hapus filter Status'));
    expect(filters).toHaveLength(0);
  });

  it('renders custom filter component from meta.filter.component', () => {
    render(
      <TestWrapper columnFilters={[{ id: 'customCol', value: 'test' }]} />
    );
    // The custom column's pill label
    expect(screen.getByText('Custom')).toBeDefined();
    // FakeSelect renders
    expect(screen.getByTestId('fake-select')).toBeDefined();
  });

  it('returns null when no columns declare meta.filter', () => {
    const noFilterCols: ColumnDef<TRow>[] = [
      { accessorKey: 'name', meta: { title: 'Nama' } },
      { accessorKey: 'status', meta: { title: 'Status' } },
    ];

    function EmptyTable() {
      const table = useReactTable({
        data,
        columns: noFilterCols,
        getCoreRowModel: getCoreRowModel(),
      });
      return (
        <DataTableFilterBar
          table={table}
          columns={noFilterCols}
          columnFilters={[]}
          onColumnFiltersChange={() => {}}
        />
      );
    }

    const { container } = render(<EmptyTable />);
    expect(container.innerHTML).toBe('');
  });
});
```

- [ ] **Step 3: Run tests**

```bash
bun run test:run -- tests/components/shared/data-table-filter-bar.test.tsx
```

Expected: all 6 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/table/data-table-filter-bar.tsx tests/components/shared/data-table-filter-bar.test.tsx
git commit -m "feat(table): add filter bar with +Filter dropdown and active pills"
```

---

### Task 8: Wire filter bar into DataTable

**Files:**

- Modify: `src/components/shared/table/data-table.tsx`

**Interfaces:**

- Consumes: `DataTableFilterBar` from data-table-filter-bar.tsx, `ColumnFiltersState` from @tanstack/react-table
- Produces: updated `DataTable` with filter support

- [ ] **Step 1: Modify DataTable to add columnFilters state and render filter bar**

Replace `src/components/shared/table/data-table.tsx` with:

```tsx
'use client';

import * as React from 'react';

import Link from 'next/link';

import { Add02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';

import DataTableColumnVisibility from './data-table-column-visibility';
import DataTableFilterBar from './data-table-filter-bar';
import { DataTablePagination } from './data-table-pagination';
import DataTableSearchBar from './data-table-search-bar';
import { getFilter } from './filters/registry';
import type { TColumnFilter } from './filters/types';

// React Compiler memoizes reads on TanStack Table's stable column handle, so
// column.getIsSorted() goes stale. Mirror sorting into React context and read
// the direction from there — same root-cause fix as pagination (AGENTS.md).
export const SortingStateContext = React.createContext<SortingState>([]);

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  createButton?: React.ReactNode | string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  createButton,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState<string>('');
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // Scoping to opt-in columns: a column participates in the global filter
  // only when its `meta.enableSearch` is true. Source of truth lives in each
  // ColumnDef's `meta`, out of the search bar — so the same flag that gates
  // filtering also builds the placeholder ("Cari Nama atau Nama Wali …").
  const searchableColumns = React.useMemo(
    () =>
      columns.filter(
        (column) =>
          (
            column as unknown as {
              meta?: { enableSearch?: boolean };
            }
          ).meta?.enableSearch === true
      ),
    [columns]
  );

  const searchPlaceholder = React.useMemo(() => {
    const labels = searchableColumns
      .map((column) => {
        const title = (
          column as unknown as {
            meta?: { title?: string };
          }
        ).meta?.title;
        return typeof title === 'string' && title.length > 0 ? title : null;
      })
      .filter((label): label is string => label !== null);
    return labels.length > 0 ? `Cari ${labels.join(' atau ')}…` : 'Cari…';
  }, [searchableColumns]);

  // Enrich columns with filterFn from registry or custom meta, plus wire
  // enableGlobalFilter the same way as before.
  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(
    () =>
      columns.map((column) => {
        const meta = (
          column as unknown as {
            meta?: { enableSearch?: boolean; filter?: TColumnFilter };
          }
        ).meta;

        const enriched: ColumnDef<TData, TValue> = {
          ...column,
          enableGlobalFilter: meta?.enableSearch === true,
        };

        // Wire column-level filterFn from registry or custom meta
        if (meta?.filter) {
          if ('type' in meta.filter) {
            const registration = getFilter(meta.filter.type);
            if (registration) {
              enriched.filterFn = registration.filterFn as never;
            }
          } else {
            enriched.filterFn = meta.filter.filterFn as never;
          }
        }

        return enriched;
      }),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      // Reset to first page so a narrowing result never strands the view on an
      // empty page beyond the filtered set.
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      // Reset to first page when a column filter changes — same rationale as
      // the global-filter guard above.
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    state: {
      pagination,
      sorting,
      columnVisibility,
      globalFilter,
      columnFilters,
    },
  });

  // React Compiler memoizes JSX reads of the stable-identity `table` getters,
  // yielding stale pagination values. Derive from React state instead.
  const pageCount = Math.max(1, Math.ceil(data.length / pagination.pageSize));
  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex < pageCount - 1;

  return (
    <SortingStateContext.Provider value={sorting}>
      <div className="m-2 flex items-center gap-2 justify-between">
        <DataTableSearchBar
          table={table}
          globalFilter={globalFilter}
          placeholder={searchPlaceholder}
        />
        <DataTableColumnVisibility
          table={table}
          columnVisibility={columnVisibility}
        />
        {createButton && typeof createButton === 'string' ? (
          <Link
            href={createButton as string}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <HugeiconsIcon icon={Add02Icon} />
            Tambah Murid
          </Link>
        ) : (
          <>{createButton}</>
        )}
      </div>
      <DataTableFilterBar
        table={table}
        columns={columns}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
      />
      <div className="bg-table-body-bg overflow-hidden rounded-xl border-2! border-black/30">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="bg-table-header-bg text-table-header-fg text-sm font-semibold whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DataTablePagination
          table={table}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={pageCount}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
        />
      </div>
    </SortingStateContext.Provider>
  );
}
```

- [ ] **Step 2: Run typecheck and existing tests**

```bash
bun run typecheck --noEmit 2>&1 | tail -5
bun run test:run 2>&1 | tail -10
```

Expected: typecheck passes. All existing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/table/data-table.tsx
git commit -m "feat(table): wire column filtering into DataTable with filter bar"
```

---

### Task 9: Add select filters to kid status and term columns

**Files:**

- Modify: `src/features/kid/components/columns.tsx`

- [ ] **Step 1: Add meta.filter to status and enrolledTermName columns**

Replace lines 87–108 (status and enrolledTermName columns) in `src/features/kid/components/columns.tsx`:

```tsx
  {
    accessorKey: 'status',
    meta: {
      title: 'Status',
      filter: { type: 'select' } as const,
    },
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const badge = STATUS_BADGE[status] ?? STATUS_BADGE.waiting;
      return (
        <Badge variant={badge.variant as 'default' | 'secondary' | 'outline'}>
          {badge.label}
        </Badge>
      );
    },
  },
  {
    accessorFn: (row) => row.enrolledTerm?.name ?? '-',
    id: 'enrolledTermName',
    meta: {
      title: 'Term',
      filter: { type: 'select' } as const,
    },
    header: 'Term',
    cell: ({ row }) => {
      return <span>{row.getValue('enrolledTermName') ?? '-'}</span>;
    },
  },
```

Since the `meta.filter` type is not yet on TanStack Table's `ColumnMeta`, we need to extend the type. Add at the top of `columns.tsx`, after the imports:

```tsx
// Extend TanStack Table ColumnMeta to accept our filter config.
// This declaration is module-augmented — it merges with @tanstack/react-table's ColumnMeta.
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ColumnMeta<TData, TValue> {
    filter?: import('@/components/shared/table/filters/types').TColumnFilter;
  }
}
```

Wait — `ColumnMeta` already has `title?: string` and `enableSearch?: boolean` used in this project. Those are probably already augmented somewhere. Let me check...

Actually, they're typed as `unknown` objects via casting (`column as unknown as { meta?: { ... } }`). The `meta` property on TanStack's `ColumnDef` is a generic `ColumnMeta` that defaults to `unknown`. The cast pattern in the codebase bypasses TS checking entirely.

For the `meta.filter` to work without casts, we need to declare the ColumnMeta interface. But the cleanest approach that matches the existing codebase pattern is to cast, same as `enableSearch` is cast everywhere.

So the columns file doesn't need a type declaration — the meta.filter will work because TanStack's ColumnDef accepts any meta object, and the DataTable/filter-bar cast to read it.

The status column change:

```tsx
  {
    accessorKey: 'status',
    meta: { title: 'Status', filter: { type: 'select' as const } },
    header: 'Status',
    ...
  },
  {
    accessorFn: (row) => row.enrolledTerm?.name ?? '-',
    id: 'enrolledTermName',
    meta: { title: 'Term', filter: { type: 'select' as const } },
    header: 'Term',
    ...
  },
```

Wait, the `as const` assertion on the inner object — `{ type: 'select' as const }` — this makes TypeScript infer the type as `{ type: "select" }` instead of `{ type: string }`. But since the meta is cast to `unknown` in the DataTable anyway, this doesn't matter for consumers. It only matters if something reads `meta.filter` with proper typing.

Actually, `as const` on the nested value won't work properly. `{ type: 'select' as const }` should be `{ type: 'select' } as const`. Let me use:

```tsx
meta: { title: 'Status', filter: { type: 'select' } as const },
```

Or simpler — since the DataTable casts to `unknown` anyway:

```tsx
meta: { title: 'Status', filter: { type: 'select' } },
```

The `type: 'select'` will type-check fine in a vanilla TS context — it'll be inferred as `string` but the DataTable casts it when consuming. Let me keep it simple.

OK, let me finalize the step.

- [ ] **Step 1: Add meta.filter to status and enrolledTermName columns**

In `src/features/kid/components/columns.tsx`, modify the status column (line 87–99):

```tsx
  {
    accessorKey: 'status',
    meta: { title: 'Status', filter: { type: 'select' } },
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const badge = STATUS_BADGE[status] ?? STATUS_BADGE.waiting;
      return (
        <Badge variant={badge.variant as 'default' | 'secondary' | 'outline'}>
          {badge.label}
        </Badge>
      );
    },
  },
```

And the enrolledTermName column (line 101–108):

```tsx
  {
    accessorFn: (row) => row.enrolledTerm?.name ?? '-',
    id: 'enrolledTermName',
    meta: { title: 'Term', filter: { type: 'select' } },
    header: 'Term',
    cell: ({ row }) => {
      return <span>{row.getValue('enrolledTermName') ?? '-'}</span>;
    },
  },
```

- [ ] **Step 2: Run typecheck and existing tests**

```bash
bun run typecheck --noEmit 2>&1 | tail -5
bun run test:run 2>&1 | tail -10
```

Expected: typecheck passes. All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/features/kid/components/columns.tsx
git commit -m "feat(kid): add select filters to status and term columns"
```

---

### Task 10: Integration verification

- [ ] **Step 1: Run full test suite**

```bash
bun run test:run
```

Expected: all tests pass.

- [ ] **Step 2: Run dev server and smoke-test manually within dev server**

```bash
bun run dev &
sleep 5
echo "Dev server should be running — open http://localhost:3000/dashboard/owner/kid"
echo "Verify: Filter bar appears with '+ Filter' button"
echo "Verify: 'Status' and 'Term' appear in dropdown"
echo "Verify: Selecting 'Status' adds a pill with select dropdown"
echo "Verify: Selecting a status filters the table"
echo "Verify: 'Term' filter ANDs with 'Status' filter"
echo "Verify: Global search ANDs with active filters"
echo "Verify: Removing a pill restores unfiltered rows"
```

- [ ] **Step 3: Kill dev server after smoke test**

```bash
kill %1 2>/dev/null
```

- [ ] **Step 4: Commit any fixes**

```bash
git status
git add -A
git commit -m "chore: integration verification — all tests pass"
```

---

## What's NOT in this plan

- **Debounced text filter** — the basic text filter uses immediate `onChange`. Debounce can be added to the `TextFilter` component later without changing any interface.
- **Read/edit mode toggle on pills** — filter component is always visible in the pill. Add the read-mode collapse later if visual clutter becomes an issue with many active filters.
- **Multi-select filter** — the type exists in `TColumnFilter` but no component is built. Add when a column needs it.
- **Boolean filter** — type exists, no component. Add when needed.
- **URL query param syncing** — filters are in-memory only. Add when users want shareable filtered views.
- **Server-side filtering** — all filtering is client-side against the loaded dataset.
