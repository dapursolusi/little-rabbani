'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { getStatusBadge } from '@/components/shared/get-status-badge';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';

import {
  getActiveTerm,
  getEnrolledKidsPaginated,
  getKidMonthlyReportsBatch,
  getMonthOptions,
} from '@/lib/actions/monthly-report';
import type { IMonthOption } from '@/lib/actions/monthly-report';

const PAGE_SIZE = 10;

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

interface ITermData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface IKidData {
  id: string;
  name: string;
  guardian: { name: string } | null;
}

export default function MonthlyReportPickerPage() {
  const [term, setTerm] = useState<ITermData | null>(null);
  const [termError, setTermError] = useState<string | null>(null);
  const [loadingTerm, setLoadingTerm] = useState(true);

  const [months, setMonths] = useState<IMonthOption[]>([]);
  const [existingReportsMap, setExistingReportsMap] = useState<
    Map<string, { id: string; month: string; status: string }>
  >(new Map());

  const [kids, setKids] = useState<IKidData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingKids, setLoadingKids] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch active term and month options once on mount
  useEffect(() => {
    async function init() {
      const termResult = await getActiveTerm();
      if (!termResult.success) {
        setTermError(termResult.error);
        setLoadingTerm(false);
        return;
      }
      setTerm(termResult.data);
      setLoadingTerm(false);

      const monthsResult = await getMonthOptions(termResult.data.id);
      if (monthsResult.success) {
        setMonths(monthsResult.data);
      }
    }
    init();
  }, []);

  // Fetch paginated kids + batch reports when search/page changes
  useEffect(() => {
    if (!term) return;
    const currentTerm = term;

    let cancelled = false;

    async function fetch() {
      if (cancelled) return;
      setLoadingKids(true);
      setError(null);

      const kidsResult = await getEnrolledKidsPaginated(
        currentTerm.id,
        search,
        page,
        PAGE_SIZE
      );
      if (cancelled) return;
      if (!kidsResult.success) {
        setError(kidsResult.error);
        setLoadingKids(false);
        return;
      }

      const {
        kids: kidsData,
        total: totalData,
        totalPages: totalPagesData,
      } = kidsResult.data;
      setKids(kidsData);
      setTotal(totalData);
      setTotalPages(totalPagesData);

      // Fetch batch reports for the current page of kids
      if (kidsData.length > 0) {
        const batchResult = await getKidMonthlyReportsBatch(
          kidsData.map((k: IKidData) => k.id)
        );
        if (cancelled) return;
        if (batchResult.success) {
          const map = new Map<
            string,
            { id: string; month: string; status: string }
          >();
          for (const report of batchResult.data) {
            map.set(`${report.kidId}:${report.month}`, {
              id: report.id,
              month: report.month,
              status: report.status,
            });
          }
          setExistingReportsMap(map);
        }
      } else {
        setExistingReportsMap(new Map());
      }

      setLoadingKids(false);
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [term, search, page]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  // Loading state
  if (loadingTerm) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Laporan Bulanan
        </h1>
        <div className="flex items-center justify-center rounded-lg border bg-muted p-8 text-center">
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // No active term
  if (termError) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Laporan Bulanan
        </h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border bg-muted p-8 text-center">
          <p className="text-muted-foreground">{termError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Laporan Bulanan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Term aktif: {term!.name} ({term!.startDate} — {term!.endDate})
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          placeholder="Cari nama murid..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-destructive">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loadingKids && (
        <div className="flex items-center justify-center rounded-lg border bg-muted p-8 text-center">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      )}

      {/* No kids matching search */}
      {!loadingKids && !error && kids.length === 0 && (
        <EmptyState
          title={search ? 'Murid tidak ditemukan' : 'Belum ada murid terdaftar'}
        />
      )}

      {/* Kid list with month options */}
      {!loadingKids && !error && kids.length > 0 && (
        <div className="space-y-4">
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
                      className="rounded-lg border border-dashed p-3 text-left transition-colors hover:border-primary hover:shadow-sm"
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

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
