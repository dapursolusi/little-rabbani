'use client';

import * as React from 'react';

import type { FilterFn } from '@tanstack/react-table';

import type { FilterComponentProps } from './types';

export function TextFilter({ value, onChange }: FilterComponentProps) {
  const [local, setLocal] = React.useState((value as string) ?? '');
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocal(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(next || undefined);
    }, 300);
  };

  return (
    <input
      type="text"
      value={local}
      onChange={handleChange}
      placeholder="Cari..."
      className="w-full min-w-[140px] rounded border border-input bg-background px-2 py-1 text-sm"
    />
  );
}

export const textFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  if (value == null) return true;
  const cellValue = String(row.getValue(columnId) ?? '').toLowerCase();
  return cellValue.includes(String(value).toLowerCase());
};
