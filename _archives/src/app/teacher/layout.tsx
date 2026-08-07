import { LogoutButtonClient } from '@/components/layout/logout-button';
import { TeacherTabs } from '@/components/layout/teacher-tabs';
import { OfflineIndicator } from '@/components/sections/offline-indicator';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-canvas">
      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Header */}
      <header className="flex items-center justify-between border-b border bg-background px-4 py-3">
        <h1 className="text-lg font-semibold text-foreground">
          Dashboard Guru
        </h1>
        <LogoutButtonClient />
      </header>

      {/* Tab navigation */}
      <TeacherTabs />

      {/* Page content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
