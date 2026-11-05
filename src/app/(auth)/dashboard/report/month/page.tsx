import { redirect } from 'next/navigation';

import * as classSessionService from '@/features/class-session/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import MonthlyReportClient from '@/features/report/month/components/client';
import * as termService from '@/features/term/services';

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; classSessionId?: string }>;
}) {
  const { termId, classSessionId } = await searchParams;

  const [terms, classSessions, currentTerm] = await Promise.all([
    termService.getTerms(),
    classSessionService.getClassSessions(),
    termService.checkCurrentTerm(),
  ]);

  if (!termId && currentTerm) {
    redirect(`/dashboard/report/month?termId=${currentTerm.id}`);
  }

  const enrolledKids = termId
    ? await kidEnrollmentService.getKidsEnrollments({
        termId,
        classSessionId,
      })
    : null;

  return (
    <div className="mx-auto max-w-300">
      <p className="pb-4 font-semibold text-center">
        Laporan Bulanan Orang Tua
      </p>
      {terms && (
        <MonthlyReportClient
          terms={terms}
          classSessions={classSessions}
          currentTermId={termId ?? ''}
          currentClassSessionId={classSessionId ?? ''}
          enrolledKids={enrolledKids ?? []}
        />
      )}
    </div>
  );
}
