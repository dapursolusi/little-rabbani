import { notFound } from 'next/navigation';

import { GuardianForm } from '@/components/sections/guardian-form';
import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';

import { getGuardian } from '@/lib/actions/guardian';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Wali Murid' };

interface IEditGuardianPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGuardianPage({
  params,
}: IEditGuardianPageProps) {
  const { id } = await params;
  const result = await getGuardian(id);

  if (!result.success) {
    notFound();
  }

  const guardianData = result.data;

  return (
    <div className="p-4 sm:p-6">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard/owner' },
          { label: 'Wali Murid', href: '/dashboard/owner/guardian' },
          { label: guardianData.name },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Edit Wali Murid
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Perbarui data wali murid</p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <GuardianForm
          mode="edit"
          initialData={{
            id: guardianData.id,
            name: guardianData.name,
            phone: guardianData.phone,
            email: guardianData.email ?? '',
            secondContactName: guardianData.secondContactName ?? '',
            secondContactPhone: guardianData.secondContactPhone ?? '',
          }}
        />
      </div>
    </div>
  );
}
