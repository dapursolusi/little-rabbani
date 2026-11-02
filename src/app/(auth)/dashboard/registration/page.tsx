import * as classSessionService from '@/features/class-session/services';
import KidEnrollmentClient from '@/features/kid-enrollment/components/client';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as termService from '@/features/term/services';

export default async function KidEnrollmentListPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; classSessionId?: string }>;
}) {
  const { termId, classSessionId = 'all' } = await searchParams;

  const [terms, classSessions, currentTerm] = await Promise.all([
    termService.getTerms(),
    classSessionService.getClassSessions(),
    termService.checkCurrentTerm(),
  ]);

  // First load has no ?termId — default to the current term so the select
  // shows its name and the data matches. resolve once to avoid a parallel
  // checkCurrentTerm() auto-insert race.

  const enrollments = await kidEnrollmentService.getKidsEnrollments({
    termId: termId ?? currentTerm?.id,
    classSessionId: classSessionId ?? undefined,
  });

  return (
    <KidEnrollmentClient
      key={`${currentTerm?.id}-${classSessionId}`}
      terms={terms}
      classSessions={classSessions}
      data={enrollments}
      selectedTermId={currentTerm?.id}
      selectedClassSessionId={classSessionId}
      currentTermId={currentTerm?.id}
    />
  );
}
