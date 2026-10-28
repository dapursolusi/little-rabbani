import { redirect } from 'next/navigation';

import KidReportClient from '@/features/report/kid/components/client';
import { getLocalDateString } from '@/utils/date-local';

export default async function KidReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    termId: string;
    classSessionId: string;
    month: string;
  }>;
}) {
  const { id } = await params;
  const currentYearMonth = getLocalDateString().slice(0, 7);
  const { termId, classSessionId, month: yearMonthParam } = await searchParams;
  if (!yearMonthParam) {
    redirect(
      `/dashboard/report/kid/${id}?termId=${termId}&classSessionId=${classSessionId}&month=${currentYearMonth}`
    );
  }

  return (
    <div>
      <p>{currentYearMonth}</p>
      <KidReportClient
        kidId={id}
        termId={termId}
        classSessionId={classSessionId}
      />
    </div>
  );
}
