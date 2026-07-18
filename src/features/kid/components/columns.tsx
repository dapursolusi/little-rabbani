'use client';

import { STATUS_BADGE } from '@/features/kid/constants';
import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/table/data-table-row-action';
import { Badge } from '@/components/ui/badge';

import { getAge } from '@/lib/age';

import { deleteKid } from '../actions';
import { Kid } from '../types';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export const kidColumns: ColumnDef<Kid>[] = [
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
    accessorKey: 'dob',
    meta: { title: 'Usia' },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Usia" />;
    },
    cell: ({ row }) => {
      return <span>{getAge(row.getValue('dob')) ?? '-'}</span>;
    },
  },
  {
    accessorFn: (row) => row.guardian?.name ?? '-',
    id: 'guardianName',
    meta: { title: 'Nama Wali', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Nama Wali" />;
    },
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'status',
    meta: {
      title: 'Status',
      filter: {
        type: 'select',
        options: [
          { label: 'Menunggu', value: 'waiting' },
          { label: 'Terdaftar', value: 'enrolled' },
          { label: 'Alumni', value: 'alumni' },
        ],
      },
    },
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const badge = STATUS_BADGE[status] ?? STATUS_BADGE.waiting;
      return (
        <Badge variant={badge.variant as 'default' | 'secondary' | 'outline'}>
          {badge.label}
        </Badge>
      );
    },
  },
  {
    accessorFn: (row) => row.enrolledTerm?.name ?? '-',
    id: 'enrolledTermName',
    meta: { title: 'Term', filter: { type: 'select' } },
    header: 'Term',
    cell: ({ row }) => {
      return <span>{row.getValue('enrolledTermName') ?? '-'}</span>;
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
            delete: () => deleteKid(row.original.id),
          }}
          rowName={row.original.name}
        />
      );
    },
  },
];
