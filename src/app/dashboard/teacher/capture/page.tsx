import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';

import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';

import { getTeacherSessions } from './actions';

export const metadata = { ...baseMetadata, title: 'Observasi Murid' };

export default async function CaptureSessionPickerPage() {
  const result = await getTeacherSessions();

  if (!result.success) {
    if (result.error === 'redirect') {
      redirect('/login');
    }
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const sessions = result.data;

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
          Observasi Murid
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pilih sesi untuk melakukan observasi
        </p>
      </div>

      {/* No sessions state */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
          <p className="text-zinc-500">Belum ada sesi</p>
        </div>
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
                  const sessionEnd = new Date(
                    `${session.date}T${session.endTime}`
                  );
                  const now = new Date();
                  const isPast = now >= sessionEnd;

                  return isPast && !session.isHoliday ? (
                    <Link
                      key={session.id}
                      href={`/dashboard/teacher/capture/${session.id}`}
                      className="rounded-lg border border-green-200 bg-white p-4 transition-colors hover:border-green-300 hover:shadow-sm"
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
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-300"
                        >
                          Buka
                        </Badge>
                      </div>
                    </Link>
                  ) : (
                    <div
                      key={session.id}
                      className={`rounded-lg border bg-white p-4 ${
                        session.isHoliday
                          ? 'border-red-200 bg-red-50'
                          : 'border-zinc-200 opacity-60'
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
                        ) : (
                          <Badge variant="outline" className="text-zinc-400">
                            Akan Datang
                          </Badge>
                        )}
                      </div>
                    </div>
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
