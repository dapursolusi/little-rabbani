import { ActivityForm } from '@/components/sections/activity-form';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tambah Aktivitas' };

export default function CreateActivityPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Tambah Aktivitas
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Masukkan aktivitas baru ke katalog
        </p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <ActivityForm mode="create" />
      </div>
    </div>
  );
}
