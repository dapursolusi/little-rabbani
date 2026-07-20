import { SessionTypeFormWrapper } from '@/components/sections/session-type-form-wrapper';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tambah Tipe Sesi' };

export default function CreateSessionTypePage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Tambah Tipe Sesi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat tipe sesi baru (waktu blok untuk kegiatan belajar)
        </p>
      </div>
      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        <SessionTypeFormWrapper
          mode="create"
          initialData={{ name: '', start: '', end: '' }}
        />
      </div>
    </div>
  );
}
