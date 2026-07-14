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
      aria-label="Filter"
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
  if (value == null) return false;
  const rowValue = row.getValue(columnId);
  if (rowValue == null) return false;
  return String(rowValue) === String(value);
};
