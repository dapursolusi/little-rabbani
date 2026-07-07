import Link from 'next/link';

import { Badge } from '@/components/ui/badge';

import { getSessionsForDailyReports } from '@/lib/actions/daily-report';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Harian' };

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

export default async function DailyReportPickerPage() {
  const result = await getSessionsForDailyReports();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const sessions = result.data;
  const nowISO = new Date().toISOString();

  // Group by term
  const sessionsByTerm = sessions.reduce<
    Record<string, (typeof sessions)[0][]>
  >((acc, session) => {
    const termName = session.term?.name ?? 'Tanpa Term';
    if (!acc[termName]) acc[termName] = [];
    acc[termName].push(session);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Laporan Harian Orang Tua
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pilih sesi untuk membuat laporan harian wali murid
        </p>
      </div>

      {/* No sessions */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
          <p className="text-zinc-500">Belum ada sesi</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(sessionsByTerm).map(([termName, termSessions]) => (
            <div key={termName}>
              <h2 className="mb-3 text-lg font-medium text-zinc-800">
                {termName}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {termSessions.map((session) => {
                  const isPast =
                    nowISO >= `${session.date}T${session.endTime}:00`;
                  const reportCount = session.reportCount ?? 0;

                  return (
                    <Link
                      key={session.id}
                      href={`/dashboard/owner/reports/daily/${session.id}`}
                      className={`rounded-lg border bg-white p-4 transition-colors hover:shadow-sm ${
                        session.isHoliday
                          ? 'border-red-200 bg-red-50'
                          : reportCount > 0
                            ? 'border-green-200'
                            : isPast
                              ? 'border-amber-200'
                              : 'border-zinc-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900">
                            {formatDate(session.date)}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {session.startTime} — {session.endTime}
                            {session.label && ` • ${session.label}`}
                          </p>
                        </div>
                        {session.isHoliday ? (
                          <Badge variant="destructive">Libur</Badge>
                        ) : reportCount > 0 ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-700 hover:bg-green-100"
                          >
                            {reportCount} Laporan
                          </Badge>
                        ) : isPast ? (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-300"
                          >
                            Generate
                          </Badge>
                        ) : (
                          <Badge variant="outline">Akan Datang</Badge>
                        )}
                      </div>
                      {!session.isHoliday && !isPast && (
                        <p className="mt-2 text-xs text-zinc-400">
                          Sesi akan datang
                        </p>
                      )}
                      {!session.isHoliday && isPast && reportCount === 0 && (
                        <p className="mt-2 text-xs text-amber-600">
                          Klik untuk generate laporan
                        </p>
                      )}
                      {!session.isHoliday && reportCount > 0 && (
                        <p className="mt-2 text-xs text-green-600">
                          {reportCount} laporan tersimpan, klik untuk review
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
