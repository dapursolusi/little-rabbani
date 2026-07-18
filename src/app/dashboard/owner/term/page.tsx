import { createTerm, getTerms } from '@/features/term/actions';
import { termColumns } from '@/features/term/components/columns';
import { termFields } from '@/features/term/fields';

import { EmptyState } from '@/components/shared/empty-state';
import { DataTable } from '@/components/shared/table/data-table';
import { Card, CardContent } from '@/components/ui/card';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Term' };

export default async function TermListPage() {
  const result = await getTerms();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const terms = result.data;

  if (terms.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Term</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola periode pembelajaran
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyState
              title="Belum ada data term"
              actionLabel="Tambah Term"
              actionHref="/dashboard/owner/term/create"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Term</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola periode pembelajaran
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg">
        <DataTable
          columns={termColumns}
          data={terms}
          meta={{ label: metadata.title }}
          form={{
            schemaKey: 'term',
            initialData: {
              name: '',
              startDate: '',
              endDate: '',
            },
            formFields: termFields(),
            onSubmit: createTerm,
          }}
        />
      </div>
    </div>
  );
}
