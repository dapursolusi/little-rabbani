'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { formatDate } from '@/lib/format';

import { getTeacherSessionsFiltered } from './actions';

const PAGE_SIZE = 50;

interface ISessionData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  isHoliday: boolean;
  holidayReason: string | null;
  term: { name: string } | null;
}

export function CaptureSessionPickerClient() {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
    ).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setData({ sessions: result.data, total: result.total ?? 0 });
      }
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

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateFrom(e.target.value);
      setPage(1);
    },
    []
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateTo(e.target.value);
      setPage(1);
    },
    []
  );

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  // Group by term name
  const sessionsByTerm = data.sessions.reduce<Record<string, ISessionData[]>>(
    (acc, session) => {
      const termName = session.term?.name ?? 'Tanpa Term';
      if (!acc[termName]) acc[termName] = [];
      acc[termName].push(session);
      return acc;
    },
    {}
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Observasi Murid
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih sesi untuk melakukan observasi
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Cari
          </label>
          <SearchInput
            placeholder="Cari tanggal, label, atau term..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Dari
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={handleDateFromChange}
            className="h-8"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Sampai
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={handleDateToChange}
            className="h-8"
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
          {Object.entries(sessionsByTerm).map(([termName, termSessions]) => (
            <div key={termName}>
              <h2 className="mb-3 text-lg font-medium text-muted-foreground">
                {termName}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {termSessions.map((session) => {
                  const sessionEnd = new Date(
                    `${session.date}T${session.endTime}`
                  );
                  const now = new Date();
                  const isPast = now >= sessionEnd;

                  return isPast && !session.isHoliday ? (
                    <Link
                      key={session.id}
                      href={`/dashboard/teacher/capture/${session.id}`}
                      className="rounded-lg border border-success/30 bg-background p-4 transition-colors hover:border-success/50 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {formatDate(session.date)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {session.startTime} — {session.endTime}
                            {session.label && ` • ${session.label}`}
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
                  ) : (
                    <div
                      key={session.id}
                      className={`rounded-lg border bg-background p-4 ${
                        session.isHoliday
                          ? 'border-destructive/20 bg-destructive/10'
                          : 'border opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {formatDate(session.date)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {session.startTime} — {session.endTime}
                            {session.label && ` • ${session.label}`}
                          </p>
                        </div>
                        {session.isHoliday ? (
                          <Badge variant="destructive">Libur</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Akan Datang
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
