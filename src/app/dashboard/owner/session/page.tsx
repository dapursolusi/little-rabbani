import Link from 'next/link';

import { SessionActions } from '@/components/sections/session-actions';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getSessions, getTerm } from '@/lib/actions/term';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Sesi' };

interface ISessionListPageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function SessionListPage({
  searchParams,
}: ISessionListPageProps) {
  const { termId } = await searchParams;

  // If no termId selected, show term selector
  if (!termId) {
    return <TermSelectorPage />;
  }

  const [termResult, sessionsResult] = await Promise.all([
    getTerm(termId),
    getSessions(termId),
  ]);

  if (!termResult.success) {
    return (
      <div className="p-4 text-center text-destructive">{termResult.error}</div>
    );
  }

  if (!sessionsResult.success) {
    return (
      <div className="p-4 text-center text-destructive">
        {sessionsResult.error}
      </div>
    );
  }

  const termData = termResult.data;
  const sessions = sessionsResult.data;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/owner/term"
              className="text-sm text-primary hover:underline"
            >
              &larr; Kembali
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            Sesi - {termData.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {termData.startDate} — {termData.endDate}
            {termData.isActive && (
              <Badge variant="default" className="ml-2">
                Aktif
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/owner/session/create?termId=${termId}`}
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            Tambah Sesi
          </Link>
          <Link
            href={`/dashboard/owner/session/generate?termId=${termId}`}
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            Generate Berulang
          </Link>
        </div>
      </div>

      {/* Table */}
      {sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-zinc-500">Belum ada sesi untuk term ini</p>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/dashboard/owner/session/create?termId=${termId}`}
                className={cn(buttonVariants({ variant: 'default' }))}
              >
                Tambah Sesi
              </Link>
              <Link
                href={`/dashboard/owner/session/generate?termId=${termId}`}
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Generate Berulang
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.id} className={s.isHoliday ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">
                    {formatDate(s.date)}
                  </TableCell>
                  <TableCell>
                    {s.startTime} — {s.endTime}
                  </TableCell>
                  <TableCell>{s.label}</TableCell>
                  <TableCell>
                    {s.isHoliday ? (
                      <Badge variant="destructive">
                        Libur{s.holidayReason ? `: ${s.holidayReason}` : ''}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <SessionActions
                      sessionId={s.id}
                      termId={termId}
                      isHoliday={s.isHoliday}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/**
 * Term selector shown when no termId is provided.
 * Lists all terms so user can pick one to view/edit sessions.
 */
async function TermSelectorPage() {
  const { getTerms } = await import('@/lib/actions/term');
  const result = await getTerms();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const terms = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Sesi</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pilih term untuk melihat sesi
        </p>
      </div>

      {terms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-zinc-500">
              Belum ada term. Buat term terlebih dahulu.
            </p>
            <Link
              href="/dashboard/owner/term/create"
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
            >
              Tambah Term
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/owner/session?termId=${t.id}`}
              className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-zinc-900">{t.name}</h3>
                {t.isActive && (
                  <Badge variant="default" className="ml-2">
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {t.startDate} — {t.endDate}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {t.sessions.length} sesi
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
