import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { type Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PaginationInfo {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  filteredRowCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
}

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination: PaginationInfo;
}

export function DataTablePagination<TData>({
  table,
  pagination,
}: DataTablePaginationProps<TData>) {
  const startItem = pagination.pageIndex * pagination.pageSize + 1;
  const endItem = Math.min(
    startItem + pagination.pageSize - 1,
    pagination.filteredRowCount
  );
  const total = pagination.filteredRowCount;

  return (
    <div className="my-3 flex flex-col items-center gap-2 px-2 sm:flex-row sm:justify-between">
      {/* ---- Item range ---- */}
      <span className="text-sm text-muted-foreground tabular-nums">
        Menampilkan {startItem}–{endItem} dari {total}
      </span>

      {/* ---- Controls ---- */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Page size */}
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium whitespace-nowrap max-sm:sr-only">
            Baris per halaman
          </p>
          <Select
            value={`${pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-10 md:size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!pagination.canPreviousPage}
          >
            <span className="sr-only">Ke halaman pertama</span>
            <HugeiconsIcon icon={ChevronFirstIcon} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 md:size-8"
            onClick={() => table.previousPage()}
            disabled={!pagination.canPreviousPage}
          >
            <span className="sr-only">Ke halaman sebelumnya</span>
            <HugeiconsIcon icon={ChevronLeftIcon} />
          </Button>
          <span className="text-sm font-medium tabular-nums text-center min-w-[6ch]">
            Hal {pagination.pageIndex + 1}/{pagination.pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-10 md:size-8"
            onClick={() => table.nextPage()}
            disabled={!pagination.canNextPage}
          >
            <span className="sr-only">Ke halaman berikutnya</span>
            <HugeiconsIcon icon={ChevronRightIcon} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 md:size-8"
            onClick={() => table.setPageIndex(pagination.pageCount - 1)}
            disabled={!pagination.canNextPage}
          >
            <span className="sr-only">Ke halaman terakhir</span>
            <HugeiconsIcon icon={ChevronLastIcon} />
          </Button>
        </div>
      </div>
    </div>
  );
}
