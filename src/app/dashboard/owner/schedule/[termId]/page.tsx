import Link from 'next/link';

import { getTerm } from '@/features/term/actions';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { isNull } from 'drizzle-orm';

import { HolidayCalendarView } from '@/components/sections/holiday-calendar-view';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

import { db } from '@/lib/db';
import { sessionType } from '@/lib/db/schema';
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

  const termResult = await getTerm(termId);

  // Load session types
  const allTypes = await db.query.sessionType.findMany({
    where: isNull(sessionType.deletedAt),
  });

  if (!termResult.success) {
    return (
      <div className="p-4 text-center text-destructive">{termResult.error}</div>
    );
  }

  const termData = termResult.data;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] p-4 sm:p-6">
      {/* Calendar sidebar */}
      <div>
        <HolidayCalendarView termId={termId} />
      </div>

      {/* Session content */}
      <div className="min-w-0">
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

        {/* Session Types */}
        {allTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted py-16">
            <p className="text-muted-foreground">
              Belum ada tipe sesi. Buat tipe sesi terlebih dahulu.
            </p>
            <Link
              href={`/dashboard/owner/session-type`}
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
            >
              Kelola Tipe Sesi
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {allTypes.map((st) => {
              const today = new Date().toISOString().split('T')[0];
              return (
                <div key={st.id} className="rounded-lg border bg-background">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h3 className="font-medium text-foreground">{st.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {st.start} — {st.end}
                      </p>
                    </div>
                    <Badge variant="outline">Aktif</Badge>
                  </div>
                  <div className="px-4 py-3">
                    <SessionScheduleEditor
                      sessionId={st.id}
                      date={today}
                      sessionTypeId={st.id}
                      sessionType={st}
                      isLocked={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
