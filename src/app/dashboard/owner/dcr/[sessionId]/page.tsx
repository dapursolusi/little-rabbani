import { notFound } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';

import { getCalendarEventsForDcr, getDcrBySession } from '@/lib/actions/dcr';
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

  const [dcrResult, scheduleResult] = await Promise.all([
    getDcrBySession(today, sessionId),
    getCalendarEventsForDcr(today, sessionId),
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

  if (!existingDcr) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard/owner' },
          { label: 'DCR / Observasi Kelas', href: '/dashboard/owner/dcr' },
          { label: existingDcr.date },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {existingDcr ? 'Edit Laporan Harian' : 'DCR / Observasi Kelas'}
        </h1>
      </div>

      {!existingDcr && scheduleItems.length === 0 && (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm text-warning">
            Belum ada jadwal aktivitas untuk sesi ini.
          </p>
        </div>
      )}

      <DcrForm
        sessionId={sessionId}
        initialActivities={[]}
        existingDcrId={existingDcr?.id ?? null}
        learningNotes={existingDcr?.learningNotes ?? ''}
        isEditing={!!existingDcr}
      />
    </div>
  );
}
