'use client';

import { useRouter } from 'next/navigation';

import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  deleteCurriculumItem,
  reorderCurriculumItem,
  updateCurriculumItem,
} from '../actions';
import { Curriculum } from '../types';

export const curriculumColumns: ColumnDef<Curriculum>[] = [
  {
    id: 'sortOrder',
    header: 'No.',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.sortOrder + 1}
      </span>
    ),
  },
  {
    accessorKey: 'name',
    meta: { title: 'Nama Aktivitas', enableSearch: true },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Aktivitas" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name') ?? '-'}</span>
    ),
  },
  {
    id: 'subTheme',
    header: 'Sub Tema',
    cell: ({ row }) => {
      const st = row.original.subTheme;
      return (
        <span className="text-sm text-muted-foreground">
          {st?.theme?.name
            ? `${st.theme.name} — ${st.name}`
            : (st?.name ?? '-')}
        </span>
      );
    },
  },
  {
    accessorKey: 'objective',
    meta: { title: 'Tujuan' },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tujuan" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-2">
        {(row.getValue('objective') as string) ?? '-'}
      </span>
    ),
  },
  {
    accessorKey: 'indoor',
    meta: {
      title: 'Lokasi',
      filter: {
        type: 'select',
        options: [
          { label: 'Indoor', value: 'true' },
          { label: 'Outdoor', value: 'false' },
        ],
      },
    },
    header: 'Lokasi',
    cell: ({ row }) => {
      const indoor = row.getValue('indoor') as boolean;
      return indoor ? (
        <Badge variant="outline">Indoor</Badge>
      ) : (
        <Badge variant="outline">Outdoor</Badge>
      );
    },
  },
  {
    accessorKey: 'itemsToBring',
    meta: { title: 'Perlengkapan' },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Perlengkapan" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-2">
        {(row.getValue('itemsToBring') as string) ?? '-'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;
      return <CurriculumRowActions item={item} />;
    },
  },
];

function CurriculumRowActions({ item }: { item: Curriculum }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={async () => {
          const result = await reorderCurriculumItem(
            item.id,
            item.sortOrder - 1
          );
          if (result.success) {
            toast.success('Urutan berhasil diubah');
            router.refresh();
          }
        }}
        disabled={item.sortOrder === 0}
        title="Naik"
      >
        <HugeiconsIcon icon={ArrowUp01Icon} className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={async () => {
          const result = await reorderCurriculumItem(
            item.id,
            item.sortOrder + 1
          );
          if (result.success) {
            toast.success('Urutan berhasil diubah');
            router.refresh();
          }
        }}
        // ponytail: no max check — last item clicking just won't find a swap target, no-op
        title="Turun"
      >
        <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" />
      </Button>
      <RowActionsDialog
        id={item.id}
        rowName={item.name}
        title="Edit Item Kurikulum"
        description="Perbarui data item kurikulum"
        initialData={{
          subThemeId: item.subThemeId,
          name: item.name,
          objective: item.objective ?? '',
          indoor: item.indoor ? 'true' : 'false',
          itemsToBring: item.itemsToBring ?? '',
        }}
        updateAction={updateCurriculumItem}
        deleteAction={() => deleteCurriculumItem(item.id)}
      />
    </div>
  );
}
