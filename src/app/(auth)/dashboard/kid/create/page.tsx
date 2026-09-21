import * as classSessionAction from '@/features/class-session/actions';
import { ClassSession } from '@/features/class-session/types';
import KidForm from '@/features/kid/components/form';
import * as termAction from '@/features/term/actions';
import { Term } from '@/features/term/types';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tambah Murid' };

export default async function CreateKidPage() {
  const [termResults, classSessionResults] = await Promise.all([
    termAction.getTerms(),
    classSessionAction.getClassSessions(),
  ]);
  if (!termResults.success || !classSessionResults.success) {
    return (
      <div className="p-4 text-center text-destructive">
        {(termResults as { error: string }).error ||
          (classSessionResults as { error: string }).error ||
          'Gagal memuat data'}
      </div>
    );
  }

  const terms = (termResults.data as Term[]) ?? [];
  const classSessions = (classSessionResults.data as ClassSession[]) ?? [];
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Tambah Murid</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftarkan murid baru beserta data walinya
        </p>
      </div>

      <div className="mx-auto max-w-2xl rounded-lg border bg-card p-6">
        <KidForm
          mode="create"
          initialData={{
            guardianMode: 'new',
            kid: {
              name: '',
              nickName: '',
              gender: '',
              dob: '',
              relationship: '',
            },
            guardian: {
              name: '',
              phone: '',
              email: '',
              secondContactName: '',
              secondContactPhone: '',
            },
          }}
          terms={terms ?? []}
          classSessions={classSessions ?? []}
        />
      </div>
    </div>
  );
}
