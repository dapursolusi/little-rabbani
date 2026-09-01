import * as classSessionAction from '@/features/class-session/actions';
import KidEnrollmentForm from '@/features/kid-enrollment/components/form';
import * as kidAction from '@/features/kid/actions';
import * as termAction from '@/features/term/actions';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Daftar Murid Baru' };

export default async function CreateKidEnrollmentPage() {
  const [termResult, classSessionResult, kidsResult] = await Promise.all([
    termAction.getTerms(),
    classSessionAction.getClassSessions(),
    kidAction.getKids(),
  ]);
  return (
    <KidEnrollmentForm
      terms={termResult.success ? termResult.data : []}
      classSessions={classSessionResult.success ? classSessionResult.data : []}
      kids={kidsResult.success ? kidsResult.data : []}
    />
  );
}
