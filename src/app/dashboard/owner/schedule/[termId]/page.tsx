import Link from 'next/link';

import { getSessions } from '@/features/session/actions';
import { getTerm } from '@/features/term/actions';
import { Alert01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

import { SessionScheduleEditor } from './session-schedule-editor';

export const metadata = { ...baseMetadata, title: 'Jadwal Mingguan' };

interface IScheduleTermPageProps {
  params: Promise<{ termId: string }>;
}

export default async function ScheduleTermPage({
  params,
}: IScheduleTermPageProps) {
  const { termId } = await params;

  const [termResult, sessionsResult] = await Promise.all([
    getTerm(termId),
    getSessions(termId),
  ]);

  if (!termResult.success) {
    return (
      <div className="p-4 text-center text-destructive">{termResult.error}</div>
    );
  }

  if (!sessionsResult.success) {
    return (
      <div className="p-4 text-center text-destructive">
        {sessionsResult.error}
      </div>
    );
  }

  const termData = termResult.data;
  const sessions = sessionsResult.data;

  const nowISO = new Date().toISOString();

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/owner/schedule"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Pilih Term
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Jadwal - {termData.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(termData.startDate)} — {formatDate(termData.endDate)}
          {termData.isActive && (
            <Badge variant="default" className="ml-2">
              Aktif
            </Badge>
          )}
        </p>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted py-16">
          <p className="text-muted-foreground">
            Belum ada sesi untuk term ini. Buat sesi terlebih dahulu.
          </p>
          <Link
            href={`/dashboard/owner/session?termId=${termId}`}
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
          >
            Kelola Sesi
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const isLocked =
              nowISO >= `${session.date}T${session.startTime}:00`;
            const isFuture = nowISO < `${session.date}T${session.startTime}:00`;

            return (
              <div
                key={session.id}
                className={`rounded-lg border bg-background ${
                  session.isHoliday
                    ? 'border-destructive/30 bg-destructive/10'
                    : isLocked
                      ? 'border opacity-70'
                      : 'border'
                }`}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {formatDate(session.date)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {session.startTime} — {session.endTime}
                      {session.label && ` • ${session.label}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.isHoliday && (
                      <Badge variant="destructive">
                        Libur
                        {session.holidayReason
                          ? `: ${session.holidayReason}`
                          : ''}
                      </Badge>
                    )}
                    {!session.isHoliday && isLocked && (
                      <Badge variant="outline">Terkunci</Badge>
                    )}
                    {!session.isHoliday && isFuture && (
                      <Badge variant="outline">Akan Datang</Badge>
                    )}
                    {!session.isHoliday && !isLocked && !isFuture && (
                      <Badge variant="secondary">Berlangsung</Badge>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3">
                  {session.isHoliday ? (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      <p className="font-medium flex items-center gap-1">
                        <HugeiconsIcon icon={Alert01Icon} className="size-4" />
                        Hari Libur
                      </p>
                      <p className="mt-1 text-xs">
                        {session.holidayReason
                          ? `Alasan: ${session.holidayReason}`
                          : 'Tanggal ini adalah hari libur — tidak dapat menambahkan jadwal aktivitas'}
                      </p>
                    </div>
                  ) : (
                    <SessionScheduleEditor
                      sessionId={session.id}
                      isLocked={isLocked}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
