'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/table/data-table-row-action';

import { Guardian } from '../types';

export const guardianColumns: ColumnDef<Guardian>[] = [
  {
    accessorKey: 'name',
    meta: { title: 'Nama', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Nama" />;
    },
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue('name') ?? '-'}</span>;
    },
  },
  {
    accessorKey: 'phone',
    meta: { title: 'Nomor Telepon', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Nomor Telepon" />;
    },
    cell: ({ row }) => {
      return <span>{row.getValue('phone') ?? '-'}</span>;
    },
  },
  {
    accessorKey: 'email',
    meta: { title: 'Email', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Email" />;
    },
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('email') ?? '-'}</span>
    ),
  },
  {
    accessorFn: (row) => row.kids?.length ?? '-',
    id: 'kidsCount',
    meta: { title: 'Jumlah Anak', filter: { type: 'select' } },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Jumlah Anak" />;
    },
    cell: ({ row }) => {
      return <span>{row.getValue('kidsCount') ?? '-'}</span>;
    },
  },

  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DataTableRowActions
          id={row.original.id}
          actions={{
            edit: () => {},
            delete: () => {},
          }}
          rowName={row.original.name}
        />
      );
    },
  },
];
