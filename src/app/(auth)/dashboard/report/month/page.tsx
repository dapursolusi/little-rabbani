import * as classSessionAction from '@/features/class-session/actions';
import * as kidEnrollmentAction from '@/features/kid-enrollment/actions';
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

  const kidsResults = await kidEnrollmentAction.getKidsEnrollments({
    termId,
    classSessionId,
  });

  if (!kidsResults.success) {
    <p>Terjadi kesalahan memuat data anak, silahkan muat ulang!</p>;
  }

  return (
    <div className="mx-auto max-w-225">
      <p className="pb-4 font-semibold text-center">
        Laporan Bulanan Orang Tua
      </p>
      <MonthlyReportClient
        terms={termsResults.data ?? []}
        classSessions={classSessionsResults.data ?? []}
        currentTermId={termId ?? ''}
        currentClassSessionId={classSessionId ?? ''}
        currentKids={kidsResults.data ?? []}
      />
    </div>
  );
}
