import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';

import {
  getCalendarEventsForDcr,
  getDcrBySession,
  getNextCurriculumForSession,
} from '@/lib/actions/dcr';
import { baseMetadata } from '@/lib/metadata';

import { DcrForm } from './dcr-form';

export const metadata = { ...baseMetadata, title: 'DCR / Observasi Kelas' };

interface IDcrCapturePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function DcrCapturePage({ params }: IDcrCapturePageProps) {
  const { sessionId } = await params;

  // ponytail: [sessionId] route — sessionId is used as sessionTypeId with today's date
  // Full migration to (date, sessionTypeId) routing is a follow-up
  const today = new Date().toISOString().split('T')[0];

  const [dcrResult, scheduleResult, curriculumResult] = await Promise.all([
    getDcrBySession(today, sessionId),
    getCalendarEventsForDcr(today, sessionId),
    getNextCurriculumForSession(sessionId),
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
  const nextCurriculum = curriculumResult.success
    ? curriculumResult.data
    : null;

  // Build initial activities: existing DCR activities (edit) or curriculum item (create)
  let initialActivities: Array<{
    id: string;
    activityName: string;
    activityNameOther: string | null;
    deviation: 'done' | 'skipped' | 'modified';
    wasPlanned: boolean;
  }> = [];

  let curriculumId: string | null = null;

  if (existingDcr) {
    // Edit mode — use existing DCR activities
    initialActivities = existingDcr.dcrActivities.map(
      (a: {
        id: string;
        activityNameOther: string | null;
        deviation: 'done' | 'skipped' | 'modified';
        wasPlanned: boolean;
      }) => ({
        id: a.id,
        activityName: a.activityNameOther ?? '',
        activityNameOther: a.activityNameOther,
        deviation: a.deviation,
        wasPlanned: a.wasPlanned,
      })
    );
    curriculumId = existingDcr.curriculumId;
  } else if (nextCurriculum) {
    // Create mode — pre-populate from curriculum
    curriculumId = nextCurriculum.id;
    initialActivities = [
      {
        id: `planned-${nextCurriculum.id}`,
        activityName: nextCurriculum.name,
        activityNameOther: null,
        deviation: 'done' as const,
        wasPlanned: true,
      },
    ];
  }

  const displayDate = existingDcr?.date ?? today;

  return (
    <div className="p-4 sm:p-6">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Aktivitas Kelas', href: '/dashboard/daily' },
          { label: displayDate },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {existingDcr ? 'Edit Laporan Harian' : 'DCR / Observasi Kelas'}
        </h1>
      </div>

      {!existingDcr && scheduleItems.length === 0 && !nextCurriculum && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm text-warning">
            Belum ada jadwal aktivitas untuk sesi ini.
          </p>
        </div>
      )}

      {!existingDcr && !nextCurriculum && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            Kurikulum untuk term aktif sudah selesai. Silakan tambahkan
            aktivitas tidak terencana.
          </p>
        </div>
      )}

      <DcrForm
        sessionId={sessionId}
        initialActivities={initialActivities}
        existingDcrId={existingDcr?.id ?? null}
        curriculumId={curriculumId}
        learningNotes={existingDcr?.learningNotes ?? ''}
        isEditing={!!existingDcr}
      />
    </div>
  );
}
