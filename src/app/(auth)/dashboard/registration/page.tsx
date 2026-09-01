import * as classSessionAction from '@/features/class-session/actions';
import * as kidEnrollmentAction from '@/features/kid-enrollment/actions';
import KidEnrollmentContent from '@/features/kid-enrollment/components/content';
import { KidEnrollment } from '@/features/kid-enrollment/types';
import * as termAction from '@/features/term/actions';

export default async function KidEnrollmentListPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; classSessionId?: string }>;
}) {
  const { termId, classSessionId = 'all' } = await searchParams;

  const [termResult, classSessionResult, currentTermResult] = await Promise.all(
    [
      termAction.getTerms(),
      classSessionAction.getClassSessions(),
      termAction.checkCurrentTerm(),
    ]
  );

  // First load has no ?termId — default to the current term so the select
  // shows its name and the data matches. resolve once to avoid a parallel
  // checkCurrentTerm() auto-insert race.
  const effectiveTermId =
    termId ??
    (currentTermResult.success ? currentTermResult.data.id : undefined);

  const enrollmentsResult = await kidEnrollmentAction.getKidsEnrollments({
    termId: effectiveTermId,
    classSessionId,
  });

  if (!termResult.success) {
    return (
      <div className="p-4 text-center text-destructive">{termResult.error}</div>
    );
  }

  if (!classSessionResult.success) {
    return (
      <div className="p-4 text-center text-destructive">
        {classSessionResult.error}
      </div>
    );
  }

  if (!enrollmentsResult.success) {
    return (
      <div className="p-4 text-center text-destructive">
        {enrollmentsResult.error}
      </div>
    );
  }

  return (
    <KidEnrollmentContent
      terms={termResult.data}
      classSessions={classSessionResult.data}
      data={enrollmentsResult.data as unknown as KidEnrollment[]}
      selectedTermId={effectiveTermId}
      selectedClassSessionId={classSessionId}
      currentTermId={currentTermResult.success ? currentTermResult.data.id : ''}
    />
  );
}
