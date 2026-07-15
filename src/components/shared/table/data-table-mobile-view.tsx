import { ChildIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { type Cell, type Table, flexRender } from '@tanstack/react-table';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';

interface DataTableMobileViewProps<TData> {
  table: Table<TData>;
}

/** Derive a label from the column header: string header → as-is, otherwise → meta.title → column.id */
function getHeaderLabel<TData>(cell: Cell<TData, unknown>): string {
  const header = cell.column.columnDef.header;
  if (typeof header === 'string') return header;
  const meta = (cell.column.columnDef as { meta?: { title?: string } }).meta;
  return meta?.title ?? cell.column.id;
}

export function DataTableMobileView<TData>({
  table,
}: DataTableMobileViewProps<TData>) {
  return (
    <div className="flex w-full flex-col gap-6 md:hidden">
      {table.getRowModel().rows.length > 0 ? (
        <>
          {table.getRowModel().rows.map((row) => {
            const cells = row.getVisibleCells();
            const dataCells = cells.filter(
              (cell) => cell.column.id !== 'actions'
            );
            const actionCells = cells.filter(
              (cell) => cell.column.id === 'actions'
            );
            const [titleCell, ...remainingDataCells] = dataCells;

            return (
              <Item
                variant="outline"
                key={row.id}
                className="w-full bg-accent/20"
              >
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={ChildIcon} size={40} />
                </ItemMedia>

                <ItemContent className="self-start">
                  {titleCell ? (
                    <ItemTitle className="text-base font-semibold">
                      {flexRender(
                        titleCell.column.columnDef.cell,
                        titleCell.getContext()
                      )}
                    </ItemTitle>
                  ) : (
                    <ItemTitle>&mdash;</ItemTitle>
                  )}

                  <ItemDescription className="table w-full table-auto">
                    {remainingDataCells.map((cell) => (
                      <span key={cell.id} className="table-row">
                        <span className="table-cell  w-[1%] whitespace-nowrap pr-3 py-0.5 text-muted-foreground text-xs">
                          {getHeaderLabel(cell)}:
                        </span>
                        <span className="table-cell py-0.5 text-foreground text-sm font-medium">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </span>
                      </span>
                    ))}
                  </ItemDescription>
                </ItemContent>

                {actionCells.length > 0 && (
                  <ItemActions className="self-start">
                    {flexRender(
                      actionCells[0].column.columnDef.cell,
                      actionCells[0].getContext()
                    )}
                  </ItemActions>
                )}
              </Item>
            );
          })}
        </>
      ) : (
        <div>No data available</div>
      )}
    </div>
  );
}
