import Link from 'next/link';

import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';

import { getSessionsForDcr } from '@/lib/actions/dcr';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';

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
        <h1 className="text-2xl font-semibold text-foreground">
          DCR / Observasi Kelas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat atau edit laporan harian untuk setiap sesi
        </p>
      </div>

      {/* No sessions state */}
      {sessions.length === 0 ? (
        <EmptyState
          title="Belum ada sesi"
          actionLabel="Buat Sesi Baru"
          actionHref="/dashboard/owner/session"
        />
      ) : (
        /* Sessions grouped by term */
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
                  const hasDcr = session.dcr !== null;

                  return (
                    <Link
                      key={session.id}
                      href={`/dashboard/owner/dcr/${session.id}`}
                      className={`rounded-lg border bg-background p-4 transition-colors hover:shadow-sm ${
                        session.isHoliday
                          ? 'border-destructive/30 bg-destructive/10'
                          : hasDcr
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
                        ) : hasDcr ? (
                          <Badge
                            variant="default"
                            className="bg-success/10 text-success hover:bg-success/10"
                          >
                            <HugeiconsIcon
                              icon={CheckmarkCircle01Icon}
                              className="size-3.5 mr-1"
                            />
                            Laporan
                          </Badge>
                        ) : isPast ? (
                          <Badge
                            variant="outline"
                            className="text-warning border-warning/30"
                          >
                            Belum
                          </Badge>
                        ) : (
                          <Badge variant="outline">Akan Datang</Badge>
                        )}
                      </div>
                      {/* Show notes preview if DCR exists */}
                      {hasDcr && session.dcr?.learningNotes && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {session.dcr.learningNotes}
                        </p>
                      )}
                      {/* Show empty state message for past sessions without DCR */}
                      {!session.isHoliday && !hasDcr && isPast && (
                        <p className="mt-2 text-xs text-warning">
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
