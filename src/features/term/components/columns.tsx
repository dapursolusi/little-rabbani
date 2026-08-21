'use client';

import { ColumnDef } from '@tanstack/react-table';

import { AppTableFeatures } from '@/components/shared/table/features';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';
import { Badge } from '@/components/ui/badge';

import { deleteTerm, updateTerm } from '../actions';
import { termFormFields } from '../fields';
import { TermSchema } from '../schema';
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

      const status =
        startDate <= today && today <= endDate
          ? 'Aktif'
          : today < startDate
            ? 'Belum dimulai'
            : 'Selesai';

      return (
        <div className="flex items-center gap-2">
          {status}
          {row.original.isAutoCreated && (
            <Badge variant="secondary">Draft</Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => {
      const term = row.original;
      return (
        <RowActionsDialog
          id={term.id}
          rowName={term.name}
          title="Edit Batch"
          description="Perbarui data batch"
          edit={{
            schema: TermSchema,
            formFields: termFormFields(),
            action: updateTerm,
            initialData: {
              name: term.name,
              startDate: term.startDate,
              endDate: term.endDate,
            },
          }}

          deleteAction={() => deleteTerm(term.id)}
        />
      );
    },
  },
];
