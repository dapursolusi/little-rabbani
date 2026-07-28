import {
  createCurriculumItems,
  getCurriculum,
} from '@/features/curriculum/actions';
import { BatchModal } from '@/features/curriculum/components/batch-modal';
import { curriculumColumns } from '@/features/curriculum/components/columns';
import { curriculumFields } from '@/features/curriculum/fields';
import { getActiveTerm } from '@/features/kid/actions';
import { getActiveSubThemes } from '@/features/theme/actions';

import { EmptyState } from '@/components/shared/empty-state';
import { DataTable } from '@/components/shared/table/data-table';
import { Card, CardContent } from '@/components/ui/card';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Kurikulum' };

export default async function CurriculumPage() {
  const activeTerm = await getActiveTerm();

  if (!activeTerm) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-foreground">Kurikulum</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur urutan pembelajaran untuk term aktif
        </p>
        <Card className="mt-6 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyState
              title="Belum ada term aktif"
              description="Aktifkan term terlebih dahulu untuk mulai menyusun kurikulum"
              actionLabel="Kelola Term"
              actionHref="/dashboard/owner/term"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const [curriculumResult, subThemesResult] = await Promise.all([
    getCurriculum(activeTerm.id),
    getActiveSubThemes({ withTheme: true }),
  ]);

  const items = curriculumResult.success ? curriculumResult.data : [];
  const subThemes = subThemesResult.success ? subThemesResult.data : [];

  const nextSortOrder =
    items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 1 : 0;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Kurikulum</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Term: {activeTerm.name}
          </p>
        </div>
        {subThemes.length > 0 && (
          <BatchModal
            termId={activeTerm.id}
            subThemes={subThemes}
            nextSortOrder={nextSortOrder}
          />
        )}
      </div>

      {!curriculumResult.success ? (
        <div className="p-4 text-center text-destructive">
          {curriculumResult.error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <DataTable
            columns={curriculumColumns}
            data={items}
            meta={{ label: 'Kurikulum', domain: 'curriculum' }}
            form={{
              schemaKey: 'curriculum',
              initialData: {
                subThemeId: '',
                name: '',
                objective: '',
                indoor: 'false',
                itemsToBring: '',
              },
              formFields: curriculumFields(subThemes),
              onSubmit: async (data) => {
                'use server';
                return createCurriculumItems([
                  {
                    termId: activeTerm.id,
                    sortOrder: nextSortOrder,
                    subThemeId: data.subThemeId as string,
                    name: data.name as string,
                    objective: (data.objective as string) || null,
                    indoor: (data.indoor as string) === 'true',
                    itemsToBring: (data.itemsToBring as string) || null,
                  },
                ]);
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
