import { getThemes } from '@/features/theme/actions';
import { themeColumns } from '@/features/theme/components/columns';
import { themeFields } from '@/features/theme/fields';

import { DataTable } from '@/components/shared/table/data-table';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tema' };

const PAGE_SIZE = 50;

interface IThemeListPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ThemeListPage({
  searchParams,
}: IThemeListPageProps) {
  const { search, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const result = await getThemes({ search, limit: PAGE_SIZE, offset });

  if (!result.success) {
    return (
      <section className="p-4 text-center text-destructive">
        {result.error}
      </section>
    );
  }

  const themes = result.data;
  const totalItems = result.total ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

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
      <DataTable
        columns={themeColumns}
        data={themes}
        meta={{ label: metadata.title }}
        form={{
          schemaKey: 'theme',
          initialData: { name: '', color: '' },
          formFields: themeFields(),
        }}
      />
    </section>
  );
}
