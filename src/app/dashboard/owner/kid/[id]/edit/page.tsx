import { notFound } from 'next/navigation';

import { KidForm } from '@/components/sections/kid-form';
import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';

import { getGuardians } from '@/lib/actions/guardian';
import { getKid } from '@/lib/actions/kid';
import { getTerms } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Murid' };

interface IEditKidPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKidPage({ params }: IEditKidPageProps) {
  const { id } = await params;

  const [kidResult, guardiansResult, termsResult] = await Promise.all([
    getKid(id),
    getGuardians(),
    getTerms(),
  ]);

  if (!kidResult.success) {
    notFound();
  }

  const kidData = kidResult.data;
  const guardians = guardiansResult.success ? guardiansResult.data : [];
  const terms = termsResult.success ? termsResult.data : [];

  return (
    <div className="p-4 sm:p-6">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard/owner' },
          { label: 'Murid', href: '/dashboard/owner/kid' },
          { label: kidData.name },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Edit Murid</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui data murid
        </p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        <KidForm
          mode="edit"
          initialData={{
            id: kidData.id,
            name: kidData.name,
            dob: kidData.dob,
            guardianId: kidData.guardianId,
            status: kidData.status,
            enrolledTermId: kidData.enrolledTermId ?? '',
          }}
          guardians={guardians}
          terms={terms}
        />
      </div>
    </div>
  );
}
