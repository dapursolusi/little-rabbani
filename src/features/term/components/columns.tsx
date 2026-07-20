'use client';

import { useRouter } from 'next/navigation';

import {
  CheckmarkCircle01Icon,
  GroupIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

import { activateTerm, deleteTerm, updateTerm } from '../actions';
import { Term } from '../types';

export const termColumns: ColumnDef<Term>[] = [
  {
    accessorKey: 'name',
    meta: { title: 'Nama Term', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Nama Term" />;
    },
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue('name') ?? '-'}</span>;
    },
  },
  {
    accessorKey: 'startDate',
    meta: { title: 'Tanggal Mulai' },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Tanggal Mulai" />;
    },
    cell: ({ row }) => {
      return <span>{row.getValue('startDate') ?? '-'}</span>;
    },
  },
  {
    accessorKey: 'endDate',
    meta: { title: 'Tanggal Selesai' },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Tanggal Selesai" />;
    },
    cell: ({ row }) => {
      return <span>{row.getValue('endDate') ?? '-'}</span>;
    },
  },
  {
    accessorKey: 'isActive',
    meta: { title: 'Status', filter: { type: 'select' } },
    header: 'Status',
    cell: ({ row }) => {
      const active = row.getValue('isActive') as boolean;
      return active ? (
        <Badge variant="default">Aktif</Badge>
      ) : (
        <Badge variant="outline">Tidak Aktif</Badge>
      );
    },
  },
  {
    accessorFn: (row) => row.sessions.length,
    id: 'sessionCount',
    meta: { title: 'Sesi' },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Sesi" />;
    },
    cell: ({ row }) => {
      return <span>{row.getValue('sessionCount') ?? 0}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => {
      const term = row.original;
      return <TermRowActions term={term} />;
    },
  },
];

/** Inline actions component (needs hooks for router + actions). */
function TermRowActions({ term }: { term: Term }) {
  const router = useRouter();

  return (
    <RowActionsDialog
      id={term.id}
      rowName={term.name}
      title="Edit Term"
      description="Perbarui data term"
      initialData={{
        name: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
      }}
      updateAction={updateTerm}
      deleteAction={() => deleteTerm(term.id)}
      extendedActions={
        <>
          {!term.isActive && (
            <DropdownMenuItem
              onClick={async () => {
                const result = await activateTerm(term.id);
                if (result.success) {
                  router.refresh();
                }
              }}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} />
              Aktifkan
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/owner/term/${term.id}/cohort`)
            }
          >
            <HugeiconsIcon icon={GroupIcon} />
            Kelola Murid
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/owner/session?termId=${term.id}`)
            }
          >
            <HugeiconsIcon icon={Settings01Icon} />
            Lihat Sesi
          </DropdownMenuItem>
        </>
      }
    />
  );
}
