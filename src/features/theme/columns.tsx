'use client';

import { ColumnDef } from '@tanstack/react-table';

import { DataTableColumnHeader } from '@/components/shared/table/data-table-column-header';
import { AppTableFeatures } from '@/components/shared/table/features';
import { RowActionsDialog } from '@/components/shared/table/row-actions-dialog';

import {
  deleteSubTheme,
  deleteTheme,
  updateSubTheme,
  updateTheme,
} from './actions';
import { subThemeFields, themeFields } from './fields';
import { subThemeSchema, themeSchema } from './schema';
import { SubTheme, Theme } from './types';

export const themeColumns: ColumnDef<AppTableFeatures, Theme>[] = [
  {
    accessorKey: 'name',
    meta: { title: 'Nama Tema', enableSearch: true },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Nama" />;
    },
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue('name') ?? '-'}</span>;
    },
  },

  {
    accessorKey: 'subThemes',
    meta: { title: 'Jumlah Sub Tema', enableSearch: false },
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Jumlah Sub Tema" />;
    },
    cell: ({ row }) => {
      return row.original.subThemes?.length ?? 0;
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    enableHiding: false,
    cell: ({ row }) => {
      const theme = row.original;
      return (
        <RowActionsDialog
          id={theme.id}
          rowName={theme.name}
          title="Edit Tema"
          description="Perbarui tema"
          edit={{
            schema: themeSchema,
            formFields: themeFields,
            action: updateTheme,
            initialData: {
              name: theme.name,
            },
          }}
          deleteAction={() => deleteTheme(theme.id)}
        />
      );
    },
  },
];

export function createSubThemeColumns(
  themes: Theme[]
): ColumnDef<AppTableFeatures, SubTheme>[] {
  return [
    {
      accessorKey: 'name',
      meta: { title: 'Nama Sub Tema', enableSearch: true },
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Nama" />;
      },
      cell: ({ row }) => {
        return (
          <span className="font-medium">{row.getValue('name') ?? '-'}</span>
        );
      },
    },
    {
      accessorKey: 'theme.name',
      meta: { title: 'Tema', enableSearch: false },
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Tema" />;
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      enableHiding: false,
      cell: ({ row }) => {
        const sub = row.original;
        return (
          <RowActionsDialog
            id={sub.id}
            rowName={sub.name}
            title="Edit Sub Tema"
            description="Perbarui sub tema"
            edit={{
              schema: subThemeSchema,
              formFields: subThemeFields(themes),
              action: updateSubTheme,
              initialData: {
                name: sub.name,
                themeId: sub.themeId,
              },
            }}
            deleteAction={() => deleteSubTheme(sub.id)}
          />
        );
      },
    },
  ];
}
