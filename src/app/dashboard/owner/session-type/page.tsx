import { getSessionTypes } from '@/features/sessionType/actions';
import { createSessionType } from '@/features/sessionType/actions';
import { sessionTypeColumns } from '@/features/sessionType/components/columns';
import { sessionTypeFields } from '@/features/sessionType/fields';

import { DataTable } from '@/components/shared/table/data-table';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tipe Sesi' };

export default async function SessionTypeListPage() {
  const result = await getSessionTypes({ limit: 1000 });

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const items = result.data;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tipe Sesi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola tipe sesi (waktu blok yang berulang)
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg">
        <DataTable
          columns={sessionTypeColumns}
          data={items}
          meta={{ label: 'Tipe Sesi' }}
          form={{
            schemaKey: 'sessionType',
            initialData: { name: '', start: '', end: '' },
            formFields: sessionTypeFields(),
            onSubmit: createSessionType,
          }}
        />
      </div>
    </div>
  );
}
