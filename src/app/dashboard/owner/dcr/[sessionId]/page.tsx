import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';
import { Badge } from '@/components/ui/badge';

import {
  getDcrBySession,
  getScheduleActivitiesForDcr,
} from '@/lib/actions/dcr';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';

import { DcrForm } from './dcr-form';

export const metadata = { ...baseMetadata, title: 'DCR / Observasi Kelas' };

interface IDcrCapturePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function DcrCapturePage({ params }: IDcrCapturePageProps) {
  const { sessionId } = await params;

  // Fetch existing DCR and schedule activities in parallel
  const [dcrResult, scheduleResult] = await Promise.all([
    getDcrBySession(sessionId),
    getScheduleActivitiesForDcr(sessionId),
  ]);

  if (!dcrResult.success) {
    return (
      <div className="p-4 text-center text-destructive">{dcrResult.error}</div>
    );
  }

  if (!scheduleResult.success) {
    return (
      <div className="p-4 text-center text-destructive">
        {scheduleResult.error}
      </div>
    );
  }

  const existingDcr = dcrResult.data;
  const scheduleItems = scheduleResult.data;

  // Get session info from existing DCR or schedule items
  const session = existingDcr?.session;

  // Build initial activities for the form
  // If DCR exists, use its activities. Otherwise, prefill from schedule.
  const initialActivities = existingDcr
    ? existingDcr.dcrActivities.map((a) => ({
        id: a.id,
        activityId: a.activityId,
        activityName: a.activity?.name ?? a.activityNameOther ?? '',
        activityNameOther: a.activityNameOther,
        deviation: a.deviation as 'done' | 'skipped' | 'modified',
        wasPlanned: a.wasPlanned,
      }))
    : scheduleItems.map((item) => ({
        id: item.id,
        activityId: item.activityId,
        activityName:
          item.type === 'outing'
            ? `Outing: ${item.outingLocation ?? 'Lokasi tidak ditentukan'}`
            : (item.activity?.name ?? 'Aktivitas tidak tersedia'),
        activityNameOther: null,
        deviation: 'done' as const,
        wasPlanned: true,
      }));

  const sessionLabel = session ? formatDate(session.date) : 'Sesi';

  return (
    <div className="p-4 sm:p-6">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard/owner' },
          { label: 'DCR / Observasi Kelas', href: '/dashboard/owner/dcr' },
          { label: sessionLabel },
        ]}
      />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {existingDcr ? 'Edit Laporan Harian' : 'DCR / Observasi Kelas'}
        </h1>
        {session && (
          <p className="mt-1 text-sm text-zinc-500">
            {formatDate(session.date)} — {session.startTime} — {session.endTime}
            {session.label && ` • ${session.label}`}
            {session.isHoliday && (
              <Badge variant="destructive" className="ml-2">
                Libur: {session.holidayReason ?? 'Hari libur'}
              </Badge>
            )}
          </p>
        )}
      </div>

      {/* Session is holiday - block capture */}
      {session?.isHoliday ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">
            ⚠️ Sesi ini adalah hari libur — tidak dapat membuat laporan
          </p>
          {session.holidayReason && (
            <p className="mt-1 text-sm text-red-600">
              Alasan: {session.holidayReason}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* No schedule and no existing DCR - show empty state */}
          {!existingDcr && scheduleItems.length === 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">
                Belum ada jadwal aktivitas untuk sesi ini. Anda tetap dapat
                menambahkan aktivitas secara manual.
              </p>
            </div>
          )}

          {/* DCR Form */}
          <DcrForm
            sessionId={sessionId}
            initialActivities={initialActivities}
            existingDcrId={existingDcr?.id ?? null}
            learningNotes={existingDcr?.learningNotes ?? ''}
            isEditing={!!existingDcr}
          />
        </>
      )}
    </div>
  );
}
