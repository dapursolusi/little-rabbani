import {
  createCurriculumItems,
  getCurriculum,
} from '@/features/curriculum/actions';
import { BatchModal } from '@/features/curriculum/components/batch-modal';
import { curriculumColumns } from '@/features/curriculum/components/columns';
import { curriculumFields } from '@/features/curriculum/fields';
import { getHolidays } from '@/features/holiday/actions';
import { getActiveTerm } from '@/features/kid/actions';
import { getSessionTypes } from '@/features/sessionType/actions';
import { listTermWorkdays } from '@/features/term/workdays';
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
              actionHref="/dashboard/term"
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

  // Next empty workdays of the active term, in order. New items land on the
  // first free workday(s); the server derives sortOrder from the date, so the
  // calendar shows the item on the intended day instead of term-start (Jul 1/2).
  const [holidaysResult, sessionTypesResult] = await Promise.all([
    getHolidays(),
    getSessionTypes(),
  ]);
  const holidays = holidaysResult.success ? holidaysResult.data : [];
  const hasActiveSessionType = sessionTypesResult.success
    ? sessionTypesResult.data.length > 0
    : false;
  const workdays = listTermWorkdays(
    { startDate: activeTerm.startDate, endDate: activeTerm.endDate },
    holidays.map((h) => ({ startDate: h.startDate, endDate: h.endDate })),
    hasActiveSessionType
  );
  const filled = new Set(items.map((i) => i.sortOrder));
  const nextEmptyDates = workdays.filter((_, idx) => !filled.has(idx));
  const nextEmptyDate = nextEmptyDates[0] ?? null;

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
            nextEmptyDates={nextEmptyDates}
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
                    date: nextEmptyDate,
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
