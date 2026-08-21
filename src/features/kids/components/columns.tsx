'use client';

import { GENDER_LABELS } from '@/db/schema';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import type { AppTableFeatures } from '@/components/shared/table/features';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';

import { formatAge } from '@/lib/format';

import { deleteKid } from '../actions';
import { Kid } from '../types';

// v9: first generic is the shared table feature set — `meta` is typed by its
// `columnMeta` slot (AppColumnMeta: title/enableSearch/filter).
export const kidColumns: ColumnDef<AppTableFeatures, Kid>[] = [
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
      return <span>{formatAge(row.getValue('dob') ?? '')}</span>;
    },
  },
  {
    accessorKey: 'gender',
    meta: {
      title: 'Jenis Kelamin',
      filter: {
        type: 'select',
        options: Object.entries(GENDER_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
    },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Jenis Kelamin" />;
    },
    cell: ({ row }) => {
      const gender = row.getValue('gender') as string;
      return <span>{gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>;
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
    accessorFn: (row) => row.guardian?.phone ?? '-',
    id: 'guardianPhone',
    meta: { title: 'No. HP Wali', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="No. HP Wali" />;
    },
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => {
      const kid = row.original;
      return (
        <RowActionsDialog
          id={kid.id}
          rowName={kid.name}
          title="Edit Murid"
          description="Perbarui data murid"
          edit={{ href: `/dashboard/kid/${kid.id}/edit` }}
          deleteAction={() => deleteKid(kid.id)}
        />
      );
    },
  },
];
