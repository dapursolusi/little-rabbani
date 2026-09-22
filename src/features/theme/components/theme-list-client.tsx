'use client';

import { NodeAddIcon, SubnodeAddIcon } from '@hugeicons/core-free-icons';

import ContentTabs from '@/components/shared/content-tabs';
import { DataTable } from '@/components/shared/table/data-table';

import { createSubThemeColumns, themeColumns } from '../columns';
import { SubTheme, Theme } from '../types';
import { SubThemeForm, ThemeForm } from './form';

interface ThemeListClientProps {
  themes: Theme[];
  subThemes: SubTheme[];
}

export function ThemeListClient({ themes, subThemes }: ThemeListClientProps) {
  const subThemeCols = createSubThemeColumns(themes);

  const tabs = [
    {
      triggerValue: 'theme',
      triggerLabel: 'Tema',
      icon: NodeAddIcon,
      children: (
        <DataTable
          columns={themeColumns}
          data={themes}
          meta={{ label: 'Tema' }}
          createForm={{
            createForm: <ThemeForm />,
            meta: { label: 'Tema', domain: 'theme' },
          }}
        />
      ),
    },
    {
      triggerValue: 'subTheme',
      triggerLabel: 'Sub Tema',
      icon: SubnodeAddIcon,
      children: (
        <DataTable
          columns={subThemeCols}
          data={subThemes}
          meta={{ label: 'Sub Tema' }}
          createForm={{
            createForm: <SubThemeForm themes={themes} />,
            meta: { label: 'Sub Tema', domain: 'subTheme' },
          }}
        />
      ),
    },
  ];

  return (
    <section className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tema</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola daftar tema pembelajaran
          </p>
        </div>
      </div>
      <ContentTabs tabs={tabs} />
    </section>
  );
}
