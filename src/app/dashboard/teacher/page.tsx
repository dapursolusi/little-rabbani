import { TeacherPendingCaptureBanner } from '@/components/sections/teacher-pending-capture-banner';
import { TeacherScheduleView } from '@/components/sections/teacher-schedule-view';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Dashboard Guru' };

export default function TeacherDashboardPage() {
  return (
    <>
      {/* Pending capture banner */}
      <TeacherPendingCaptureBanner />

      {/* Schedule */}
      <main className="flex-1 px-4 py-4">
        <h2 className="mb-4 text-base font-medium text-muted-foreground">
          Jadwal Hari Ini
        </h2>
        <TeacherScheduleView />
      </main>
    </>
  );
}
