'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { Badge } from '@/components/ui/badge';

import { getTeacherSessionsFiltered } from './actions';

const PAGE_SIZE = 50;

interface ISessionData {
  id: string;
  name: string;
  start: string;
  end: string;
  active: boolean;
}

export function CaptureSessionPickerClient() {
  const [search, setSearch] = useState('');
  const [dateFrom] = useState('');
  const [dateTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ sessions: ISessionData[]; total: number }>(
    {
      sessions: [],
      total: 0,
    }
  );

  // Fetch when any filter changes
  useEffect(() => {
    let cancelled = false;

    getTeacherSessionsFiltered(
      search,
      dateFrom || undefined,
      dateTo || undefined,
      page,
      PAGE_SIZE
    )
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setData({ sessions: result.data, total: result.total ?? 0 });
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, dateFrom, dateTo, page]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Observasi Murid
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih tipe sesi untuk melakukan observasi
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Cari
          </label>
          <SearchInput
            placeholder="Cari nama tipe sesi..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      ) : data.sessions.length === 0 ? (
        <EmptyState title="Tidak ada sesi ditemukan" />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.sessions.map((st) => (
              <Link
                key={st.id}
                href={`/dashboard/teacher/capture/${st.id}`}
                className="rounded-lg border border-success/30 bg-background p-4 transition-colors hover:border-success/50 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{st.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {st.start} — {st.end}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-success border-success/30"
                  >
                    Buka
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={data.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
