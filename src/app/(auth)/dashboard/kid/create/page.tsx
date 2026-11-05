import * as classSessionService from '@/features/class-session/services';
import KidForm from '@/features/kid/components/form';
import * as termService from '@/features/term/services';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tambah Murid' };

export default async function CreateKidPage() {
  const [terms, classSessions] = await Promise.all([
    termService.getTerms(),
    classSessionService.getClassSessions(),
  ]);

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
          terms={terms}
          classSessions={classSessions}
        />
      </div>
    </div>
  );
}
