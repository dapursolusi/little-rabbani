import Link from 'next/link';

import { Badge } from '@/components/ui/badge';

import { getDailyReportsForSession } from '@/lib/actions/daily-report';
import { baseMetadata } from '@/lib/metadata';

import { DailyReportClient } from './report-client';

export const metadata = {
  ...baseMetadata,
  title: 'Laporan Harian',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    "Jum'at",
    'Sabtu',
  ];
  const dayName = days[date.getDay()];
  const formatted = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${dayName}, ${formatted}`;
}

interface IDailyReportSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function DailyReportSessionPage({
  params,
}: IDailyReportSessionPageProps) {
  const { sessionId } = await params;
  const result = await getDailyReportsForSession(sessionId);

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const { session, kids, reports } = result.data;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/owner/reports/daily"
            className="text-sm text-primary hover:underline"
          >
            &larr; Kembali
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Laporan Harian Orang Tua
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {session && (
            <>
              {formatDate(session.date)} — {session.startTime} —{' '}
              {session.endTime}
              {session.label && ` • ${session.label}`}
              {session.isHoliday && (
                <Badge variant="destructive" className="ml-2">
                  Libur: {session.holidayReason ?? 'Hari libur'}
                </Badge>
              )}
            </>
          )}
        </p>
      </div>

      {/* Holiday session */}
      {session?.isHoliday && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">
            Sesi ini adalah hari libur — tidak dapat membuat laporan
          </p>
        </div>
      )}

      {/* No holiday session — render client component */}
      {!session?.isHoliday && (
        <DailyReportClient
          sessionId={sessionId}
          kids={kids}
          initialReports={reports}
        />
      )}
    </div>
  );
}
