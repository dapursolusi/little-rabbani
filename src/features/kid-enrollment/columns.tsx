import { createContext, memo, useContext } from 'react';

import { ENROLLMENT_STATUS_LABELS } from '@/db/schema';
import { ColumnDef } from '@tanstack/react-table';

import { AppTableFeatures } from '@/components/shared/table/features';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';
import { Badge } from '@/components/ui/badge';

import { getDeterministicClass } from '../../utils/badge-color';
import { KidEnrollment } from './types';

export const NewKidIdsContext = createContext<Set<string>>(new Set());

const KidNameCell = memo(function KidNameCell({
  kidId,
  name,
}: {
  kidId: string;
  name: string;
}) {
  const newKidIds = useContext(NewKidIdsContext);
  const isNew = newKidIds.has(kidId);
  return (
    <span className="flex items-center gap-2">
      {name}
      {isNew && (
        <Badge
          variant="outline"
          className="text-xs border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:bg-amber-950"
        >
          Baru
        </Badge>
      )}
    </span>
  );
});

export const kidEnrollmentColumns: ColumnDef<
  AppTableFeatures,
  KidEnrollment
>[] = [
  {
    accessorKey: 'kid.name',
    header: 'Nama',
    cell: ({ row }) => (
      <KidNameCell kidId={row.original.kidId} name={row.original.kid.name} />
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const label = ENROLLMENT_STATUS_LABELS[status];
      const statusColor =
        status === 'enrolled'
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';

      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
        >
          {label}
        </span>
      );
    },
  },
];

export const kidEnrollmentSessionColumn: ColumnDef<
  AppTableFeatures,
  KidEnrollment
> = {
  accessorKey: 'classSession.name',
  header: 'Sesi Kelas',
  cell: ({ row }) => {
    const classSessionName = row.original.classSession.name;

    if (!classSessionName) return <span>-</span>;

    const colorClass = getDeterministicClass(classSessionName);

    return (
      <Badge
        variant="outline"
        className={`${colorClass} border-none font-medium`}
      >
        {classSessionName}
      </Badge>
    );
  },
};

export const kidEnrollmentActionColumn: ColumnDef<
  AppTableFeatures,
  KidEnrollment
> = {
  id: 'actions',
  header: 'Aksi',
  enableHiding: false,
  cell: ({ row }) => {
    const kidEnrollment = row.original;
    return (
      <RowActionsDialog
        id={kidEnrollment.id}
        rowName={`${kidEnrollment.kid.name} ${kidEnrollment.term.name} ${kidEnrollment.classSession.name}`}
        title="Edit Batch"
        description="Perbarui data batch"
        edit={{
          href: '/dashboard/registration',
        }}

        deleteAction={() => {}}
      />
    );
  },
};
