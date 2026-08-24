'use client';

import { ColumnDef } from '@tanstack/react-table';

import { AppTableFeatures } from '@/components/shared/table/features';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';

import { classSessionFormFields } from './fields';
import { ClassSessionSchema } from './schema';
import { ClassSession } from './types';

export const classSessionColumns: ColumnDef<AppTableFeatures, ClassSession>[] =
  [
    {
      accessorKey: 'name',
      header: 'Nama Sesi',
      meta: { title: 'Nama Sesi', enableSearch: true },
    },
    {
      accessorKey: 'startTime',
      header: 'Jam Mulai',
      meta: { title: 'Jam Mulai', enableSearch: false },
    },
    {
      accessorKey: 'endTime',
      header: 'Jam Selesai',
      meta: { title: 'Jam Selesai', enableSearch: false },
    },
    {
      id: 'actions',
      header: 'Aksi',
      enableHiding: false,
      cell: ({ row }) => {
        const classSession = row.original;
        return (
          <RowActionsDialog
            id={classSession.id}
            rowName={classSession.name}
            title="Edit Sesi Kelas"
            description="Perbarui data sesi kelas"
            edit={{
              schema: ClassSessionSchema,
              formFields: classSessionFormFields,
              action: () => {},
              initialData: {
                name: classSession.name,
                startDate: classSession.startTime,
                endDate: classSession.endTime,
              },
            }}

            deleteAction={() => {}}
          />
        );
      },
    },
  ];
