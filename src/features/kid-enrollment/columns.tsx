import { ColumnDef } from '@tanstack/react-table';

import { AppTableFeatures } from '@/components/shared/table/features';

import { KidEnrollment } from './types';

export const kidEnrollmentColumns: ColumnDef<
  AppTableFeatures,
  KidEnrollment
>[] = [
  {
    accessorKey: 'kid.name',
    header: 'Nama',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
];

export const kidEnrollmentSessionColumn: ColumnDef<
  AppTableFeatures,
  KidEnrollment
> = {
  accessorKey: 'classSession.name',
  header: 'Sesi Kelas',
};
