import {
  createSubTheme,
  createTheme,
  getSubThemes,
  getThemes,
} from '@/features/theme/actions';
import {
  subThemeColumns,
  themeColumns,
} from '@/features/theme/components/columns';
import { subThemeFields, themeFields } from '@/features/theme/fields';
import { NodeAddIcon, SubnodeAddIcon } from '@hugeicons/core-free-icons';

import ContentTabs from '@/components/shared/content-tabs';
import { DataTable } from '@/components/shared/table/data-table';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tema' };

export default async function ThemeListPage() {
  const themeResult = await getThemes();
  const subThemeResult = await getSubThemes();

  if (!themeResult.success || !subThemeResult.success) {
    return (
      <section className="p-4 text-center text-destructive">
        {themeResult.error && subThemeResult.error}
      </section>
    );
  }

  const themes = themeResult.data;
  const subThemes = subThemeResult.data;

  const tabs = [
    {
      triggerValue: 'theme',
      triggerLabel: 'Tema',
      icon: NodeAddIcon,
      children: (
        <DataTable
          columns={themeColumns}
          data={themes}
          meta={{ label: metadata.title }}
          form={{
            schemaKey: 'theme',
            initialData: { name: '', color: '' },
            formFields: themeFields(),
            onSubmit: createTheme,
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
          columns={subThemeColumns}
          data={subThemes}
          meta={{ label: metadata.title }}
          form={{
            schemaKey: 'subTheme',
            initialData: { name: '', themeId: '' },
            formFields: subThemeFields(themes),
            onSubmit: createSubTheme,
          }}
        />
      ),
    },
  ];

  return (
    <section className="p-4 sm:p-6">
      {/* Header */}
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
