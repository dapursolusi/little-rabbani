import { ArrowDown01Icon, Layout03FreeIcons } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { type Table, type VisibilityState } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableColumnVisibilityProps<TData> {
  table: Table<TData>;
  // React Compiler memoizes reads on TanStack Table's stable column handle,
  // so column.getIsVisible() goes stale. Read off the mirrored state instead —
  // same root-cause fix as pagination (AGENTS.md).
  columnVisibility?: VisibilityState;
}

export default function DataTableColumnVisibility<TData>({
  table,
  columnVisibility = {},
}: DataTableColumnVisibilityProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="default" className="ml-auto">
            <HugeiconsIcon icon={Layout03FreeIcons} strokeWidth={2} />
            Kolom Aktif
            <HugeiconsIcon icon={ArrowDown01Icon} />
          </Button>
        }
      ></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-fit">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            const label =
              (column.columnDef.meta as { title?: string } | undefined)
                ?.title ?? column.id;
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={columnVisibility[column.id] !== false}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                <span className="truncate">{label}</span>
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
