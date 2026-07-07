import { LogoutButtonClient } from '@/components/layout/logout-button';
import { TeacherScheduleView } from '@/components/sections/teacher-schedule-view';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Dashboard Guru' };

export default function TeacherDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-zinc-900">Dashboard Guru</h1>
        <LogoutButtonClient />
      </header>

      {/* Schedule */}
      <main className="flex-1 px-4 py-4">
        <h2 className="mb-4 text-base font-medium text-zinc-700">
          Jadwal Hari Ini
        </h2>
        <TeacherScheduleView />
      </main>
    </div>
  );
}
