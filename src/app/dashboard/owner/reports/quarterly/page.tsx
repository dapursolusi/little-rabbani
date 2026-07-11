'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { getStatusBadge } from '@/components/shared/get-status-badge';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';

import {
  getEnrolledKidsForTerm,
  getKidQuarterlyReportsBatch,
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

interface IFlatKidItem {
  kid: IKidData;
  term: ITermData;
  report: { id: string; status: string } | null;
}

export default function QuarterlyReportPickerPage() {
  const [terms, setTerms] = useState<ITermData[]>([]);
  const [allKidsMap, setAllKidsMap] = useState<Map<string, IKidData[]>>(
    new Map()
  );
  const [reportsMap, setReportsMap] = useState<
    Map<string, Map<string, { id: string; status: string }>>
  >(new Map());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const termsResult = await getTerms();
      if (!termsResult.success) {
        setError(termsResult.error);
        setLoading(false);
        return;
      }

      const termsData = termsResult.data;
      setTerms(termsData);

      // Fetch enrolled kids for all terms in parallel
      const termDataResults = await Promise.all(
        termsData.map(async (t: ITermData) => {
          const kidsResult = await getEnrolledKidsForTerm(t.id);
          const kids = kidsResult.success ? kidsResult.data : [];
          const kidsList = kids as IKidData[];
          return { termId: t.id, kids: kidsList };
        })
      );

      const kidsMap = new Map<string, IKidData[]>();
      for (const r of termDataResults) {
        kidsMap.set(r.termId, r.kids);
      }
      setAllKidsMap(kidsMap);

      // Batch fetch reports for all kids across all terms
      const allKidIds = termDataResults.flatMap((r) =>
        r.kids.map((k: IKidData) => k.id)
      );
      const reportsResult = await getKidQuarterlyReportsBatch(allKidIds);

      const reportsByTerm = new Map<
        string,
        Map<string, { id: string; status: string }>
      >();
      if (reportsResult.success) {
        for (const report of reportsResult.data) {
          let termMap = reportsByTerm.get(report.termId);
          if (!termMap) {
            termMap = new Map();
            reportsByTerm.set(report.termId, termMap);
          }
          termMap.set(report.kidId, { id: report.id, status: report.status });
        }
      }
      setReportsMap(reportsByTerm);

      setLoading(false);
    }

    load();
  }, []);

  // Flatten all kids across all terms, apply search filter
  const flatItems: IFlatKidItem[] = useMemo(() => {
    const items: IFlatKidItem[] = [];
    for (const term of terms) {
      const kids = allKidsMap.get(term.id) ?? [];
      const termReports = reportsMap.get(term.id) ?? new Map();
      for (const kid of kids) {
        if (search && !kid.name.toLowerCase().includes(search.toLowerCase())) {
          continue;
        }
        items.push({
          kid,
          term,
          report: termReports.get(kid.id) ?? null,
        });
      }
    }
    return items;
  }, [terms, allKidsMap, reportsMap, search]);

  const totalItems = flatItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Slice for current page
  const pagedItems = flatItems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Group paged items by term
  const grouped = useMemo(() => {
    const map = new Map<string, IFlatKidItem[]>();
    for (const item of pagedItems) {
      const list = map.get(item.term.id);
      if (list) {
        list.push(item);
      } else {
        map.set(item.term.id, [item]);
      }
    }
    return map;
  }, [pagedItems]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  if (loading) {
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

  if (error) {
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

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Cari murid..."
        />
      </div>

      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted p-8 text-center">
          <p className="text-muted-foreground">
            {search
              ? 'Tidak ada murid yang cocok dengan pencarian'
              : 'Belum ada murid terdaftar'}
          </p>
        </div>
      )}

      {/* Term list */}
      <div className="space-y-6">
        {terms.map((termData) => {
          const termKids = grouped.get(termData.id);
          if (!termKids || termKids.length === 0) return null;

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
                {termKids.map(({ kid, report }) => (
                  <Link
                    key={kid.id}
                    href={`/dashboard/owner/reports/quarterly/${kid.id}?termId=${termData.id}`}
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
                      {kid.name}
                    </p>
                    {kid.guardian && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {kid.guardian.name}
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
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalItems > PAGE_SIZE && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
