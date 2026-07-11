import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';

import { getSessionsForDailyReports } from '@/lib/actions/daily-report';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Wali Murid' };

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
        <h1 className="text-2xl font-semibold text-foreground">
          Laporan Wali Murid
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih sesi untuk membuat laporan harian wali murid
        </p>
      </div>

      {/* No sessions */}
      {sessions.length === 0 ? (
        <EmptyState title="Belum ada sesi" />
      ) : (
        <div className="space-y-8">
          {Object.entries(sessionsByTerm).map(([termName, termSessions]) => (
            <div key={termName}>
              <h2 className="mb-3 text-lg font-medium text-foreground">
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
                      className={`rounded-lg border bg-background p-4 transition-colors hover:shadow-sm ${
                        session.isHoliday
                          ? 'border-destructive/30 bg-destructive/10'
                          : reportCount > 0
                            ? 'border-success/30'
                            : isPast
                              ? 'border-warning/30'
                              : 'border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {formatDate(session.date)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {session.startTime} — {session.endTime}
                            {session.label && ` • ${session.label}`}
                          </p>
                        </div>
                        {session.isHoliday ? (
                          <Badge variant="destructive">Libur</Badge>
                        ) : reportCount > 0 ? (
                          <Badge
                            variant="default"
                            className="bg-success/10 text-success hover:bg-success/10"
                          >
                            {reportCount} Laporan
                          </Badge>
                        ) : isPast ? (
                          <Badge
                            variant="outline"
                            className="text-warning border-warning/30"
                          >
                            Buat
                          </Badge>
                        ) : (
                          <Badge variant="outline">Akan Datang</Badge>
                        )}
                      </div>
                      {!session.isHoliday && !isPast && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Sesi akan datang
                        </p>
                      )}
                      {!session.isHoliday && isPast && reportCount === 0 && (
                        <p className="mt-2 text-xs text-warning">
                          Klik untuk buat laporan
                        </p>
                      )}
                      {!session.isHoliday && reportCount > 0 && (
                        <p className="mt-2 text-xs text-success">
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
