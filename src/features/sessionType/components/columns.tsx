'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';
import { Badge } from '@/components/ui/badge';

import { deleteSessionType, updateSessionType } from '../actions';
import { SessionType } from '../types';

export const sessionTypeColumns: ColumnDef<SessionType>[] = [
  {
    accessorKey: 'name',
    meta: { title: 'Nama Sesi', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Nama Sesi" />;
    },
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue('name') ?? '-'}</span>;
    },
  },
  {
    accessorKey: 'start',
    meta: { title: 'Jam' },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Jam" />;
    },
    cell: ({ row }) => {
      const start = row.getValue('start') as string;
      const end = row.getValue('end') as string;
      return (
        <span>
          {start} - {end}
        </span>
      );
    },
  },
  {
    accessorKey: 'active',
    meta: { title: 'Status' },
    header: 'Status',
    cell: ({ row }) => {
      const active = row.getValue('active') as boolean;
      return active ? (
        <Badge
          variant="default"
          className="bg-success/10 text-success hover:bg-success/20"
        >
          Aktif
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          Tidak Aktif
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <RowActionsDialog
          id={item.id}
          rowName={item.name}
          title="Edit Sesi"
          description="Perbarui data sesi"
          initialData={{
            name: item.name,
            start: item.start,
            end: item.end,
          }}
          updateAction={updateSessionType}
          deleteAction={() => deleteSessionType(item.id)}
        />
      );
    },
  },
];
