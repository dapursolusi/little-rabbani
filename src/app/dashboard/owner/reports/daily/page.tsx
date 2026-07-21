import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';

import { getSessionsForDailyReports } from '@/lib/actions/daily-report';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Wali Murid' };

export default async function DailyReportPickerPage() {
  const result = await getSessionsForDailyReports();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const sessions = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Laporan Wali Murid
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih tipe sesi untuk membuat laporan harian wali murid
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="Belum ada tipe sesi" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((st) => (
            <Link
              key={st.id}
              href={`/dashboard/owner/reports/daily/${st.id}`}
              className="rounded-lg border bg-background p-4 transition-colors hover:shadow-sm"
            >
              <p className="font-medium text-foreground">{st.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {st.start} — {st.end}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {st.reportCount} laporan tersimpan
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
