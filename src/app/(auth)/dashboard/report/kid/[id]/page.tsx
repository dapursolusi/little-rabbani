import { redirect } from 'next/navigation';

import KidReportClient from '@/features/report/kid/components/client';
import * as kidReportService from '@/features/report/kid/services';
import * as monthlyReportService from '@/features/report/month/services';
import * as termService from '@/features/term/services';
import { getLocalDateString } from '@/utils/date';

export default async function KidReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    termId: string;
    month: string;
  }>;
}) {
  const { id: kidId } = await params;
  const currentYearMonth = getLocalDateString().slice(0, 7);
  const { termId, month: yearMonthParam } = await searchParams;
  if (!yearMonthParam) {
    redirect(
      `/dashboard/report/kid/${kidId}?termId=${termId}&month=${currentYearMonth}`
    );
  }
  const [kidDetails, terms, academicDetailsResult] = await Promise.all([
    kidReportService.getKidMonthlyReport({
      termId,
      kidId,
      yearMonth: yearMonthParam,
    }),
    termService.getTerms(),
    monthlyReportService.getMonthlyAcademicDetails({
      kidId,
      termId,
      yearMonth: yearMonthParam,
    }),
  ]);
  return (
    <div>
      <KidReportClient
        key={`${kidId}-${termId}-${yearMonthParam}`}
        currentKidId={kidId}
        currentTermId={termId}
        currentMonth={yearMonthParam}
        initialReport={
          kidDetails?.monthlyReports?.[0]?.reportStatus
            ? {
                id: kidDetails.monthlyReports[0].id,
                narrative: kidDetails.monthlyReports[0].narrative,
                reportStatus: kidDetails.monthlyReports[0].reportStatus,
              }
            : null
        }
        kidDetails={kidDetails}
        terms={terms}
        academicDetails={academicDetailsResult.data}
      />
    </div>
  );
}
