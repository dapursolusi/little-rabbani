import Link from 'next/link';

import { LogoutButtonClient } from '@/components/layout/logout-button';
import { OfflineIndicator } from '@/components/sections/offline-indicator';
import { TeacherScheduleView } from '@/components/sections/teacher-schedule-view';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Dashboard Guru' };

export default function TeacherDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-zinc-900">Dashboard Guru</h1>
        <LogoutButtonClient />
      </header>

      {/* Navigation */}
      <nav className="flex gap-1 overflow-x-auto border-b border-zinc-100 bg-white px-4 py-2 text-sm">
        <Link
          href="/dashboard/teacher"
          className="whitespace-nowrap rounded-md bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900"
        >
          Jadwal
        </Link>
        <Link
          href="/dashboard/teacher/capture"
          className="whitespace-nowrap rounded-md px-3 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          Observasi
        </Link>
      </nav>

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
