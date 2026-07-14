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
