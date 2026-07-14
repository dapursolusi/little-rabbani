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
