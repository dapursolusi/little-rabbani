import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { getSessionsForDcr } from '@/lib/actions/dcr';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'DCR / Observasi Kelas' };

export default async function DcrPickerPage() {
  const result = await getSessionsForDcr();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const sessions = result.data;
  const nowISO = new Date().toISOString();

  // Group sessions by term name
  const sessionsByTerm = sessions.reduce<
    Record<string, (typeof sessions)[0][]>
  >((acc, session) => {
    const termName = session.term?.name ?? 'Tanpa Term';
    if (!acc[termName]) {
      acc[termName] = [];
    }
    acc[termName].push(session);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          DCR / Observasi Kelas
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Buat atau edit laporan harian untuk setiap sesi
        </p>
      </div>

      {/* No sessions state */}
      {sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-zinc-500">Belum ada sesi</p>
            <Link
              href="/dashboard/owner/session"
              className={cn(buttonVariants({ variant: 'default' }), 'mt-4')}
            >
              Buat Sesi Baru
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Sessions grouped by term */
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
                  const hasDcr = session.dcr !== null;

                  return (
                    <Link
                      key={session.id}
                      href={`/dashboard/owner/dcr/${session.id}`}
                      className={`rounded-lg border bg-white p-4 transition-colors hover:shadow-sm ${
                        session.isHoliday
                          ? 'border-red-200 bg-red-50'
                          : hasDcr
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
                        ) : hasDcr ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-700 hover:bg-green-100"
                          >
                            ✓ Laporan
                          </Badge>
                        ) : isPast ? (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-300"
                          >
                            Belum
                          </Badge>
                        ) : (
                          <Badge variant="outline">Akan Datang</Badge>
                        )}
                      </div>
                      {/* Show notes preview if DCR exists */}
                      {hasDcr && session.dcr?.learningNotes && (
                        <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                          {session.dcr.learningNotes}
                        </p>
                      )}
                      {/* Show empty state message for past sessions without DCR */}
                      {!session.isHoliday && !hasDcr && isPast && (
                        <p className="mt-2 text-xs text-amber-600">
                          Belum ada laporan — klik untuk buat
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
