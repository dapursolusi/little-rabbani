import { GuardianForm } from '@/components/sections/guardian-form';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tambah Wali Murid' };

export default function CreateGuardianPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Tambah Wali Murid
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Masukkan data wali murid baru
        </p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <GuardianForm mode="create" />
      </div>
    </div>
  );
}
