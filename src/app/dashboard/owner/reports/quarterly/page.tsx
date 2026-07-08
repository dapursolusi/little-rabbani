import Link from 'next/link';

import {
  getEnrolledKidsForTerm,
  getKidQuarterlyReports,
  getTerms,
} from '@/lib/actions/quarterly-report';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Trivulanan' };

function getStatusBadge(status: string) {
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

export default async function QuarterlyReportPickerPage() {
  const termsResult = await getTerms();

  if (!termsResult.success) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          Laporan Trivulanan
        </h1>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-zinc-500">{termsResult.error}</p>
        </div>
      </div>
    );
  }

  const terms = termsResult.data;

  if (terms.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          Laporan Trivulanan
        </h1>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-zinc-500">
            Belum ada term. Buat term terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/owner/reports"
            className="text-sm text-primary hover:underline"
          >
            &larr; Kembali
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Laporan Trivulanan
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pilih term dan murid untuk generate laporan trivulanan
        </p>
      </div>

      {/* Term list */}
      <div className="space-y-6">
        {terms.map(async (termData) => {
          const kidsResult = await getEnrolledKidsForTerm(termData.id);
          const kids = kidsResult.success ? kidsResult.data : [];

          if (kids.length === 0) return null;

          // Get existing reports for all kids in this term
          const existingReportsMap = new Map<
            string,
            { id: string; status: string }
          >();
          for (const kidData of kids) {
            const reportsResult = await getKidQuarterlyReports(kidData.id);
            if (reportsResult.success) {
              const termReport = reportsResult.data.find(
                (r: { termId: string }) => r.termId === termData.id
              );
              if (termReport) {
                existingReportsMap.set(kidData.id, {
                  id: termReport.id,
                  status: termReport.status,
                });
              }
            }
          }

          return (
            <div
              key={termData.id}
              className="rounded-lg border border-zinc-200 bg-white"
            >
              <div className="border-b border-zinc-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-zinc-900">{termData.name}</h3>
                  {termData.isActive && (
                    <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {termData.startDate} — {termData.endDate}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
                {kids.map((kidData) => {
                  const report = existingReportsMap.get(kidData.id);

                  return (
                    <Link
                      key={kidData.id}
                      href={`/dashboard/owner/reports/quarterly/${kidData.id}?termId=${termData.id}`}
                      className={`rounded-lg border p-3 text-left transition-colors hover:shadow-sm ${
                        report
                          ? report.status === 'final'
                            ? 'border-green-200 bg-green-50/30'
                            : report.status === 'stale'
                              ? 'border-purple-200 bg-purple-50/30'
                              : 'border-amber-200 bg-amber-50/30'
                          : 'border-dashed border-zinc-300 hover:border-primary'
                      }`}
                    >
                      <p className="text-sm font-medium text-zinc-800">
                        {kidData.name}
                      </p>
                      {kidData.guardian && (
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {kidData.guardian.name}
                        </p>
                      )}
                      <div className="mt-1">
                        {report ? (
                          getStatusBadge(report.status)
                        ) : (
                          <span className="text-xs text-primary">
                            Generate Laporan
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {kids.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-zinc-400">
                    Belum ada murid terdaftar di term ini
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
