'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';
import { Badge } from '@/components/ui/badge';

import { deleteTheme, updateTheme } from '../actions';
import { Theme } from '../types';

export const themeColumns: ColumnDef<Theme>[] = [
  {
    accessorKey: 'name',
    meta: { title: 'Nama Tema', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Nama" />;
    },
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue('name') ?? '-'}</span>;
    },
  },
  {
    accessorKey: 'color',
    meta: { title: 'Warna Tema', enableSearch: false },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Warna" />;
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="font-medium"
            style={{ backgroundColor: row.getValue('color') ?? undefined }}
          ></Badge>
          <span>{row.getValue('color') ?? '-'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'subThemes',
    meta: { title: 'Jumlah Sub Tema', enableSearch: false },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Jumlah Sub Tema" />;
    },
    cell: ({ row }) => {
      return row.original.subThemes?.length ?? 0;
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => {
      const theme = row.original;
      return (
        <RowActionsDialog
          id={theme.id}
          rowName={theme.name}
          title="Edit Tema"
          description="Perbarui tema"
          initialData={{
            name: theme.name,
            color: theme.color,
          }}
          updateAction={updateTheme}
          deleteAction={() => deleteTheme(theme.id)}
        />
      );
    },
  },
];
