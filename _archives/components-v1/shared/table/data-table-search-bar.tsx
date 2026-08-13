'use client';

import { Search02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { type Table } from '@tanstack/react-table';

import { Input } from '@/components/ui/input';

interface DataTableSearchBarProps<TData> {
  table: Table<TData>;
  placeholder: string;
  // Owned by DataTable as React state, not read off the stable table handle —
  // React Compiler memoizes `table.getState().globalFilter` reads and would
  // serve a stale value (AGENTS.md). The Input reads this prop instead.
  globalFilter: string;
}

export default function DataTableSearchBar<TData>({
  table,
  placeholder,
  globalFilter,
}: DataTableSearchBarProps<TData>) {
  return (
    <div className="flex items-center overflow-auto rounded-lg max-md:w-full md:w-100">
      <div className="bg-accent/30 p-2">
        <HugeiconsIcon icon={Search02Icon} size={16} strokeWidth={2} />
      </div>
      <Input
        placeholder={placeholder}
        value={globalFilter}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className="bg-table-body-bg rounded-tl-none rounded-bl-none"
      />
    </div>
  );
}
