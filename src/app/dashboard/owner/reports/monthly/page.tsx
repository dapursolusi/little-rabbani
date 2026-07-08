import Link from 'next/link';

import {
  getActiveTerm,
  getEnrolledKids,
  getKidMonthlyReports,
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

function getStatusBadge(status: string, hasContent: boolean) {
  if (!hasContent) return null;

  const styles: Record<string, string> = {
    draft: 'border-amber-300 text-amber-700 bg-amber-50',
    final: 'bg-green-100 text-green-700',
    stale: 'bg-purple-100 text-purple-700',
  };
  const labels: Record<string, string> = {
    draft: 'Draft',
    final: '✓ Final',
    stale: '⚠️ Perlu Diperbarui',
  };

  const className =
    styles[status] ?? 'border-zinc-200 text-zinc-600 bg-zinc-50';

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export default async function MonthlyReportPickerPage() {
  const termResult = await getActiveTerm();

  if (!termResult.success) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          Laporan Bulanan
        </h1>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-zinc-500">{termResult.error}</p>
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

  // Get existing monthly reports for all kids to show status
  const existingReportsMap = new Map<
    string,
    { id: string; month: string; status: string }
  >();
  for (const kidData of kids) {
    const reportsResult = await getKidMonthlyReports(kidData.id);
    if (reportsResult.success) {
      for (const report of reportsResult.data) {
        existingReportsMap.set(`${kidData.id}:${report.month}`, {
          id: report.id,
          month: report.month,
          status: report.status,
        });
      }
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Laporan Bulanan
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Term aktif: {term.name} ({term.startDate} — {term.endDate})
        </p>
      </div>

      {/* No kids enrolled */}
      {kids.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
          <p className="text-zinc-500">Belum ada murid terdaftar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Kid list with month options */}
          {kids.map((kidData) => (
            <div
              key={kidData.id}
              className="rounded-lg border border-zinc-200 bg-white"
            >
              <div className="border-b border-zinc-100 px-4 py-3">
                <h3 className="font-medium text-zinc-900">{kidData.name}</h3>
                {kidData.guardian && (
                  <p className="text-xs text-zinc-500">
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

                  return hasReport ? (
                    <Link
                      key={monthData.value}
                      href={`/dashboard/owner/reports/monthly/${kidData.id}/${monthData.value}`}
                      className={`rounded-lg border p-3 text-left transition-colors hover:shadow-sm ${
                        report?.status === 'final'
                          ? 'border-green-200 bg-green-50/30'
                          : report?.status === 'stale'
                            ? 'border-purple-200 bg-purple-50/30'
                            : 'border-amber-200 bg-amber-50/30'
                      }`}
                    >
                      <p className="text-sm font-medium text-zinc-800">
                        {formatMonthLabel(monthData.value)}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(report?.status ?? '', true)}
                      </div>
                    </Link>
                  ) : (
                    <Link
                      key={monthData.value}
                      href={`/dashboard/owner/reports/monthly/${kidData.id}/${monthData.value}`}
                      className="rounded-lg border border-dashed border-zinc-300 p-3 text-left transition-colors hover:border-primary hover:shadow-sm"
                    >
                      <p className="text-sm font-medium text-zinc-600">
                        {formatMonthLabel(monthData.value)}
                      </p>
                      <p className="mt-1 text-xs text-primary">Generate</p>
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
