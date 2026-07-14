'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { DataTableRowActions } from '@/components/shared/table/data-table-row-action';
import { Badge } from '@/components/ui/badge';

import { getAge } from '@/lib/age';

type KidRowData = {
  guardianName: string;
  enrolledTermName: string;
  id: string;
  name: string;
  dob: string;
  guardianId: string;
  status: 'waiting' | 'enrolled' | 'alumni';
  enrolledTermId: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  guardian: {
    id: string;
    name: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    secondContactName: string | null;
    secondContactPhone: string | null;
  };
  enrolledTerm: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null;
};

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  waiting: { label: 'Menunggu', variant: 'outline' },
  enrolled: { label: 'Terdaftar', variant: 'default' },
  alumni: { label: 'Alumni', variant: 'secondary' },
};

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export const kidColumns: ColumnDef<KidRowData>[] = [
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
    meta: { title: 'Status', filter: { type: 'select' } },
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
            delete: () => {},
          }}
          rowName={row.original.name}
        />
      );
    },
  },
];
