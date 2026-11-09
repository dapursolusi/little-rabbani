import { redirect } from 'next/navigation';

import * as classSessionService from '@/features/class-session/services';
import MonthlyReportClient from '@/features/report/month/components/client';
import * as monthlyReportService from '@/features/report/month/services';
import { buildReportableMonths } from '@/features/report/utils';
import * as termService from '@/features/term/services';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Bulanan' };

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    termId?: string;
    classSessionId?: string;
    month?: string;
  }>;
}) {
  const { termId, classSessionId, month } = await searchParams;

  const [terms, classSessions, currentTerm] = await Promise.all([
    termService.getTerms(),
    classSessionService.getClassSessions(),
    termService.checkCurrentTerm(),
  ]);

  // Missing required param → canonicalize the URL (never render half-scoped).
  if (!termId && currentTerm) {
    redirect(`/dashboard/report/month?termId=${currentTerm.id}`);
  }

  const term = terms?.find((t) => t.id === termId);
  if (!term) {
    return (
      <div className="mx-auto max-w-300">
        <p className="text-center font-semibold">
          Pilih batch terlebih dahulu!
        </p>
      </div>
    );
  }

  // Month: only reportable (already started) months of the selected term. An
  // invalid or future month falls back to the latest reportable one.
  const reportableMonths = buildReportableMonths([term]);
  const selectedMonth =
    month && reportableMonths.includes(month)
      ? month
      : reportableMonths[reportableMonths.length - 1];

  if (!selectedMonth) {
    return (
      <div className="mx-auto max-w-300">
        <p className="text-center font-semibold">
          Belum ada bulan laporan yang bisa dilihat.
        </p>
      </div>
    );
  }

  if (month !== selectedMonth) {
    const params = new URLSearchParams({
      termId: term.id,
      month: selectedMonth,
    });
    if (classSessionId) params.set('classSessionId', classSessionId);
    redirect(`/dashboard/report/month?${params.toString()}`);
  }

  // Unauthorized/unrelated classes are excluded by server-side scoping: the
  // enrollment query only returns children of this term (and this class).
  const overview = await monthlyReportService.getClassMonthlyReportOverview({
    termId: term.id,
    classSessionId,
    yearMonth: selectedMonth,
  });

  return (
    <div className="mx-auto max-w-300">
      <p className="pb-4 text-center font-semibold">
        Laporan Bulanan Orang Tua
      </p>
      <MonthlyReportClient
        terms={terms ?? []}
        classSessions={classSessions ?? []}
        currentTermId={term.id}
        currentClassSessionId={classSessionId ?? ''}
        currentMonth={selectedMonth}
        overview={overview}
      />
    </div>
  );
}
