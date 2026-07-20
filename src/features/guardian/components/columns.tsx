'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';

import { deleteGuardian, updateGuardian } from '../actions';
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
      const guardian = row.original;
      return (
        <RowActionsDialog
          id={guardian.id}
          rowName={guardian.name}
          title="Edit Wali Murid"
          description="Perbarui data wali murid"
          initialData={{
            name: guardian.name,
            phone: guardian.phone,
            email: guardian.email ?? '',
            secondContactName: guardian.secondContactName ?? '',
            secondContactPhone: guardian.secondContactPhone ?? '',
          }}
          updateAction={updateGuardian}
          deleteAction={() => deleteGuardian(guardian.id)}
        />
      );
    },
  },
];
