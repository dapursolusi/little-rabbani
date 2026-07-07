import { KidForm } from '@/components/sections/kid-form';

import { getGuardians } from '@/lib/actions/guardian';
import { getTerms } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tambah Murid' };

export default async function CreateKidPage() {
  const guardiansResult = await getGuardians();
  const termsResult = await getTerms();

  const guardians = guardiansResult.success ? guardiansResult.data : [];
  const terms = termsResult.success ? termsResult.data : [];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Tambah Murid</h1>
        <p className="mt-1 text-sm text-zinc-500">Masukkan data murid baru</p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <KidForm mode="create" guardians={guardians} terms={terms} />
      </div>
    </div>
  );
}
