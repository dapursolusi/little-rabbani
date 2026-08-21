'use client';

import { ColumnDef } from '@tanstack/react-table';

import { AppTableFeatures } from '@/components/shared/table/features';

import { Term } from '../types';

export const termColumns: ColumnDef<AppTableFeatures, Term>[] = [
  {
    accessorKey: 'name',
    header: 'Nama',
  },
  {
    accessorKey: 'startDate',
    header: 'Tanggal Mulai',
  },
  {
    accessorKey: 'endDate',
    header: 'Tanggal Selesai',
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const today = new Date().toISOString().split('T')[0];
      const startDate = new Date(row.original.startDate)
        .toISOString()
        .split('T')[0];
      const endDate = new Date(row.original.endDate)
        .toISOString()
        .split('T')[0];

      if (startDate <= today && today <= endDate) {
        return 'Aktif';
      } else if (today < startDate) {
        return 'Belum dimulai';
      } else if (today > endDate) {
        return 'Selesai';
      }
    },
  },
];
