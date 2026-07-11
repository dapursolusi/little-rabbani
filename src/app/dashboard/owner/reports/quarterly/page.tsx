'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { getStatusBadge } from '@/components/shared/get-status-badge';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getEnrolledKidsForTermPaginated,
  getKidQuarterlyReportsBatchForTerm,
  getTerms,
} from '@/lib/actions/quarterly-report';

const PAGE_SIZE = 24;

interface IKidData {
  id: string;
  name: string;
  guardian?: { name: string } | null;
}

interface ITermData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function QuarterlyReportPickerPage() {
  const [terms, setTerms] = useState<ITermData[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [kids, setKids] = useState<IKidData[]>([]);
  const [reportsMap, setReportsMap] = useState<
    Map<string, { id: string; status: string }>
  >(new Map());
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch terms on mount
  useEffect(() => {
    async function init() {
      const termsResult = await getTerms();
      if (!termsResult.success) {
        setError(termsResult.error);
        setLoading(false);
        return;
      }

      const termsData = termsResult.data;
      setTerms(termsData);

      // Default to first active term, or first term
      const active = termsData.find((t: ITermData) => t.isActive);
      setSelectedTermId(active?.id ?? termsData[0]?.id ?? '');
      setLoading(false);
    }
    init();
  }, []);

  // Fetch paginated kids + batch reports when term/search/page changes
  useEffect(() => {
    if (!selectedTermId || terms.length === 0) return;

    let cancelled = false;

    async function fetch() {
      if (cancelled) return;
      setLoading(true);
      setError('');

      const kidsResult = await getEnrolledKidsForTermPaginated(
        selectedTermId,
        search,
        page,
        PAGE_SIZE
      );
      if (cancelled) return;
      if (!kidsResult.success) {
        setError(kidsResult.error);
        setLoading(false);
        return;
      }

      const kidsData = kidsResult.data;
      setKids(kidsData);
      setTotal(kidsResult.total ?? 0);

      // Fetch batch reports for current page of kids
      if (kidsData.length > 0) {
        const reportsResult = await getKidQuarterlyReportsBatchForTerm(
          selectedTermId,
          kidsData.map((k: IKidData) => k.id)
        );
        if (cancelled) return;
        if (reportsResult.success) {
          const map = new Map<string, { id: string; status: string }>();
          for (const report of reportsResult.data) {
            map.set(report.kidId, { id: report.id, status: report.status });
          }
          setReportsMap(map);
        }
      } else {
        setReportsMap(new Map());
      }

      setLoading(false);
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [selectedTermId, search, page, terms.length]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleTermChange = useCallback((value: string | null) => {
    if (value) {
      setSelectedTermId(value);
      setPage(1);
    }
  }, []);

  const selectedTerm = terms.find((t) => t.id === selectedTermId);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (loading && terms.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Laporan Triwulanan
        </h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-8 text-center">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error && terms.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Laporan Triwulanan
        </h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-8 text-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

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

      {/* Term selector + Search */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Term
          </label>
          <Select value={selectedTermId} onValueChange={handleTermChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Pilih term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {t.isActive ? ' (Aktif)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Cari
          </label>
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Cari murid..."
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-destructive">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-8 text-center">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      )}

      {/* No kids */}
      {!loading && !error && kids.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-8 text-center">
          <p className="text-muted-foreground">
            {search
              ? 'Tidak ada murid yang cocok dengan pencarian'
              : 'Belum ada murid terdaftar'}
          </p>
        </div>
      )}

      {/* Kid grid */}
      {!loading && !error && kids.length > 0 && (
        <>
          <div className="mb-3">
            <h3 className="font-medium text-foreground">
              {selectedTerm?.name ?? ''}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedTerm?.startDate ?? ''} — {selectedTerm?.endDate ?? ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {kids.map((kidData) => {
              const report = reportsMap.get(kidData.id) ?? null;
              return (
                <Link
                  key={kidData.id}
                  href={`/dashboard/owner/reports/quarterly/${kidData.id}?termId=${selectedTermId}`}
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
                      <span className="text-xs text-primary">Buat Laporan</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
