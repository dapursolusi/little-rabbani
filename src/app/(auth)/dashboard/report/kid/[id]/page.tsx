import { redirect } from 'next/navigation';

import KidReportClient from '@/features/report/kid/components/client';
import * as kidReportService from '@/features/report/kid/services';
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
  const kidDataResult = await kidReportService.getKidMonthlyReport({
    termId,
    kidId,
    month: yearMonthParam,
  });
  if (!kidDataResult) {
    <p>Terjadi Kesalahan</p>;
  }

  return (
    <div>
      <KidReportClient kidId={kidId} termId={termId} />
    </div>
  );
}
