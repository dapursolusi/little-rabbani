import { CsvImportForm } from '@/components/sections/csv-import-form';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Import CSV' };

export default function CsvImportPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Import CSV</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Import data master dari file CSV
        </p>
      </div>

      <CsvImportForm />
    </div>
  );
}
