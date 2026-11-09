import { redirect } from 'next/navigation';

import * as classSessionService from '@/features/class-session/services';
import MonthlyReportClient from '@/features/report/month/components/client';
import * as monthlyReportService from '@/features/report/month/services';
import { buildReportableMonths } from '@/features/report/utils';
import * as termService from '@/features/term/services';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Bulanan' };

// Batch generation is one Server Action request per child; each carries the
// same bounded generation budget as the individual page.
export const maxDuration = 120;

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

  // A class id that is not one of this school's sessions is treated as absent;
  // it must never reach the DB as a filter or throw past the page.
  const selectedClassSessionId =
    classSessionId && classSessions?.some((cs) => cs.id === classSessionId)
      ? classSessionId
      : undefined;

  // Missing required param → canonicalize the URL (never render half-scoped).
  if (!termId && currentTerm) {
    const params = new URLSearchParams({ termId: currentTerm.id });
    if (selectedClassSessionId) {
      params.set('classSessionId', selectedClassSessionId);
    }
    redirect(`/dashboard/report/month?${params.toString()}`);
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
    if (selectedClassSessionId) {
      params.set('classSessionId', selectedClassSessionId);
    }
    redirect(`/dashboard/report/month?${params.toString()}`);
  }

  // Unauthorized/unrelated classes are excluded by server-side scoping: the
  // enrollment query only returns children of this term (and this class).
  const overview = await monthlyReportService.getClassMonthlyReportOverview({
    termId: term.id,
    classSessionId: selectedClassSessionId,
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
        currentClassSessionId={selectedClassSessionId ?? ''}
        currentMonth={selectedMonth}
        overview={overview}
      />
    </div>
  );
}
