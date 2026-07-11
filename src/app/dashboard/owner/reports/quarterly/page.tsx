import Link from 'next/link';

import { getStatusBadge } from '@/components/shared/get-status-badge';

import {
  getEnrolledKidsForTerm,
  getKidQuarterlyReportsBatch,
  getTerms,
} from '@/lib/actions/quarterly-report';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Triwulanan' };

export default async function QuarterlyReportPickerPage() {
  const termsResult = await getTerms();

  if (!termsResult.success) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Laporan Triwulanan
        </h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-8 text-center">
          <p className="text-muted-foreground">{termsResult.error}</p>
        </div>
      </div>
    );
  }

  const terms = termsResult.data;

  if (terms.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Laporan Triwulanan
        </h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-8 text-center">
          <p className="text-muted-foreground">
            Belum ada term. Buat term terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  // Fetch enrolled kids + batch report queries for all terms in parallel
  const termDataList = await Promise.all(
    terms.map(async (termData) => {
      const kidsResult = await getEnrolledKidsForTerm(termData.id);
      const kids = kidsResult.success ? kidsResult.data : [];

      if (kids.length === 0) {
        return { termData, kids: [], existingReportsMap: new Map() };
      }

      // Batch query: single inArray for all kids in this term
      const batchReportsResult = await getKidQuarterlyReportsBatch(
        kids.map((k: { id: string }) => k.id)
      );
      const existingReportsMap = new Map<
        string,
        { id: string; status: string }
      >();
      if (batchReportsResult.success) {
        for (const report of batchReportsResult.data) {
          if (report.termId === termData.id) {
            existingReportsMap.set(report.kidId, {
              id: report.id,
              status: report.status,
            });
          }
        }
      }

      return { termData, kids, existingReportsMap };
    })
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Laporan Triwulanan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih term dan murid untuk buat laporan triwulanan
        </p>
      </div>

      {/* Term list */}
      <div className="space-y-6">
        {termDataList.map(({ termData, kids, existingReportsMap }) => {
          if (kids.length === 0) return null;

          return (
            <div key={termData.id} className="rounded-lg border bg-background">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">
                    {termData.name}
                  </h3>
                  {termData.isActive && (
                    <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {termData.startDate} — {termData.endDate}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">
                {kids.map(
                  (kidData: {
                    id: string;
                    name: string;
                    guardian?: { name: string } | null;
                  }) => {
                    const report = existingReportsMap.get(kidData.id);

                    return (
                      <Link
                        key={kidData.id}
                        href={`/dashboard/owner/reports/quarterly/${kidData.id}?termId=${termData.id}`}
                        className={`rounded-lg border p-3 text-left transition-colors hover:shadow-sm ${
                          report
                            ? report.status === 'final'
                              ? 'border-success/30 bg-success/5'
                              : report.status === 'stale'
                                ? 'border-warning/30 bg-warning/5'
                                : 'border-warning/30 bg-warning/5'
                            : 'border-dashed border hover:border-primary'
                        }`}
                      >
                        <p className="text-sm font-medium text-foreground">
                          {kidData.name}
                        </p>
                        {kidData.guardian && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {kidData.guardian.name}
                          </p>
                        )}
                        <div className="mt-1">
                          {report ? (
                            getStatusBadge(report.status)
                          ) : (
                            <span className="text-xs text-primary">
                              Buat Laporan
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>

              {kids.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
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
