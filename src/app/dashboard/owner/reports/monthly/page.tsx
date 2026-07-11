import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { getStatusBadge } from '@/components/shared/get-status-badge';

import {
  getActiveTerm,
  getEnrolledKids,
  getKidMonthlyReportsBatch,
  getMonthOptions,
} from '@/lib/actions/monthly-report';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Bulanan' };

function formatMonthLabel(value: string): string {
  const [yearStr, monthStr] = value.split('-').map(Number);
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${months[monthStr - 1] ?? ''} ${yearStr}`;
}

export default async function MonthlyReportPickerPage() {
  const termResult = await getActiveTerm();

  if (!termResult.success) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Laporan Bulanan
        </h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border bg-muted p-8 text-center">
          <p className="text-muted-foreground">{termResult.error}</p>
        </div>
      </div>
    );
  }

  const term = termResult.data;
  const kidsResult = await getEnrolledKids(term.id);
  const monthsResult = await getMonthOptions(term.id);

  if (!kidsResult.success) {
    return (
      <div className="p-4 text-center text-destructive">{kidsResult.error}</div>
    );
  }

  if (!monthsResult.success) {
    return (
      <div className="p-4 text-center text-destructive">
        {monthsResult.error}
      </div>
    );
  }

  const kids = kidsResult.data;
  const months = monthsResult.data;

  // Get existing monthly reports for all kids (batch query, no N+1)
  const existingReportsMap = new Map<
    string,
    { id: string; month: string; status: string }
  >();
  const batchReportsResult = await getKidMonthlyReportsBatch(
    kids.map((k) => k.id)
  );
  if (batchReportsResult.success) {
    for (const report of batchReportsResult.data) {
      existingReportsMap.set(`${report.kidId}:${report.month}`, {
        id: report.id,
        month: report.month,
        status: report.status,
      });
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Laporan Bulanan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Term aktif: {term.name} ({term.startDate} — {term.endDate})
        </p>
      </div>

      {/* No kids enrolled */}
      {kids.length === 0 ? (
        <EmptyState title="Belum ada murid terdaftar" />
      ) : (
        <div className="space-y-4">
          {/* Kid list with month options */}
          {kids.map((kidData) => (
            <div key={kidData.id} className="rounded-lg border bg-background">
              <div className="border-b px-4 py-3">
                <h3 className="font-medium text-foreground">{kidData.name}</h3>
                {kidData.guardian && (
                  <p className="text-xs text-muted-foreground">
                    Wali: {kidData.guardian.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
                {months.map((monthData) => {
                  const report = existingReportsMap.get(
                    `${kidData.id}:${monthData.value}`
                  );
                  const hasReport = !!report;

                  const status = report?.status ?? '';

                  return hasReport ? (
                    <Link
                      key={monthData.value}
                      href={`/dashboard/owner/reports/monthly/${kidData.id}/${monthData.value}`}
                      className={`rounded-lg border p-3 text-left transition-colors hover:shadow-sm ${
                        status === 'final'
                          ? 'border-success/30 bg-success/5'
                          : status === 'stale'
                            ? 'border-warning/30 bg-warning/5'
                            : 'border-warning/30 bg-warning/5'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {formatMonthLabel(monthData.value)}
                      </p>
                      <div className="mt-1">{getStatusBadge(status)}</div>
                    </Link>
                  ) : (
                    <Link
                      key={monthData.value}
                      href={`/dashboard/owner/reports/monthly/${kidData.id}/${monthData.value}`}
                      className="rounded-lg border border-dashed border p-3 text-left transition-colors hover:border-primary hover:shadow-sm"
                    >
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatMonthLabel(monthData.value)}
                      </p>
                      <p className="mt-1 text-xs text-primary">Buat</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
