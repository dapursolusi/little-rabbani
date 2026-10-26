import * as classSessionAction from '@/features/class-session/actions';
import MonthlyReportClient from '@/features/report/month/components/client';
import * as termAction from '@/features/term/actions';

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ termId?: string; classSessionId?: string }>;
}) {
  const { termId, classSessionId } = await searchParams;

  const [termsResults, classSessionsResults] = await Promise.all([
    termAction.getTerms(),
    classSessionAction.getClassSessions(),
  ]);

  if (!termsResults.success || !classSessionsResults.success) {
    <p>Terjadi kesalahan silahkan muat ulang!</p>;
  }

  return (
    <MonthlyReportClient
      terms={termsResults.data ?? []}
      classSessions={classSessionsResults.data ?? []}
      currentTermId={termId ?? ''}
      currentClassSessionId={classSessionId ?? ''}
    />
  );
}
