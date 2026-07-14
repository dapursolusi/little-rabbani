import * as React from 'react';

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  EyeOff,
  UnfoldMoreIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { type Column } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';

import { SortingStateContext } from './data-table';

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sorting = React.useContext(SortingStateContext);
  // Read direction from the mirrored React state, not column.getIsSorted():
  // React Compiler memoizes the stable-identity column handle's getter reads
  // and serves stale direction while the row model re-sorts correctly.
  const sortDir = sorting.find((s) => s.id === column.id)?.desc;

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 data-[state=open]:bg-accent hover:bg-transparent hover:underline hover:text-white aria-expanded:bg-transparent aria-expanded:text-white aria-expanded:underline"
            >
              <span className="font-medium">{title}</span>
              {sortDir === undefined ? (
                <HugeiconsIcon icon={UnfoldMoreIcon} />
              ) : sortDir ? (
                <HugeiconsIcon icon={ArrowDown01Icon} />
              ) : (
                <HugeiconsIcon icon={ArrowUp01Icon} />
              )}
            </Button>
          }
        ></DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <HugeiconsIcon icon={ArrowUp01Icon} />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <HugeiconsIcon icon={ArrowDown01Icon} />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <HugeiconsIcon icon={EyeOff} />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
