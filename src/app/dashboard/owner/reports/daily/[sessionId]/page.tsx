import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';

import { getDailyReportsForSession } from '@/lib/actions/daily-report';
import { baseMetadata } from '@/lib/metadata';

import { DailyReportClient } from './report-client';

export const metadata = {
  ...baseMetadata,
  title: 'Laporan Wali Murid',
};

interface IDailyReportSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function DailyReportSessionPage({
  params,
}: IDailyReportSessionPageProps) {
  const { sessionId } = await params;

  // ponytail: [sessionId] route — sessionId is used as sessionTypeId with today's date
  const today = new Date().toISOString().split('T')[0];
  const result = await getDailyReportsForSession(today, sessionId);

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const { date, sessionTypeId, kids, reports } = result.data;

  return (
    <div className="p-4 sm:p-6">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard/owner' },
          {
            label: 'Laporan Wali Murid',
            href: '/dashboard/owner/reports/daily',
          },
          { label: date },
        ]}
      />
      <div className="mb-6">
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Laporan Wali Murid
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{date}</p>
      </div>

      <DailyReportClient
        sessionId={sessionTypeId}
        kids={kids}
        initialReports={reports}
      />
    </div>
  );
}
