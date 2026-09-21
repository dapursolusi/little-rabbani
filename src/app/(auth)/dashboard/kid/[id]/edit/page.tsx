import { notFound } from 'next/navigation';

import * as classSessionAction from '@/features/class-session/actions';
import { ClassSession } from '@/features/class-session/types';
import * as kidAction from '@/features/kid/actions';
import KidForm from '@/features/kid/components/form';
import * as termAction from '@/features/term/actions';
import { Term } from '@/features/term/types';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Murid' };

interface EditKidPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKidPage({ params }: EditKidPageProps) {
  const { id } = await params;

  const result = await kidAction.getKid(id);
  if (!result.success) {
    notFound();
  }

  const kid = result.data;

  const results = await Promise.all([
    termAction.getTerms(),
    classSessionAction.getClassSessions(),
  ]);

  if (!results.every((result) => result.success)) {
    return (
      <div className="p-4 text-center text-destructive">
        {results.find((result) => !result.success)?.error}
      </div>
    );
  }
  const terms =
    (results.find((result) => result.success)?.data as Term[]) ?? [];
  const classSessions =
    (results.find((result) => result.success)?.data as ClassSession[]) ?? [];

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
            guardianMode: 'existing',
            guardianId: kid.guardianId,
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
          terms={terms}
          classSessions={classSessions}
        />
      </div>
    </div>
  );
}
