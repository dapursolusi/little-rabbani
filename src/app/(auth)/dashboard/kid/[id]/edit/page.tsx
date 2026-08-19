import { notFound } from 'next/navigation';

import { getKid } from '@/features/kids/actions';
import KidForm from '@/features/kids/components/kid-form';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Murid' };

interface EditKidPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKidPage({ params }: EditKidPageProps) {
  const { id } = await params;

  const result = await getKid(id);
  if (!result.success) {
    notFound();
  }

  const kid = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Edit Murid</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui data murid atau wali
        </p>
      </div>

      <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
        <KidForm
          mode="edit"
          initialData={{
            id,
            kid: {
              name: kid.name,
              nickName: kid.nickName || '',
              gender: kid.gender,
              dob: kid.dob,
              relationship: kid.relationship,
            },
            guardian: {
              name: kid.guardian.name,
              phone: kid.guardian.phone,
              email: kid.guardian.email || '',
              secondContactName: kid.guardian.secondContactName || '',
              secondContactPhone: kid.guardian.secondContactPhone || '',
            },
          }}
        />
      </div>
    </div>
  );
}
