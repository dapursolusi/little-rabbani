import Link from 'next/link';

import { getSessions } from '@/features/session/actions';
import { getTerm } from '@/features/term/actions';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { SessionActions } from '@/components/sections/session-actions';
import { EmptyState } from '@/components/shared/empty-state';
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
              data-icon="inline-start"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} />
              Kembali
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            Sesi - {termData.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
            Buat Berulang
          </Link>
        </div>
      </div>

      {/* Table */}
      {sessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyState
              title="Belum ada sesi untuk term ini"
              actionLabel="Tambah Sesi"
              actionHref={`/dashboard/owner/session/create?termId=${termId}`}
            />
            <Link
              href={`/dashboard/owner/session/generate?termId=${termId}`}
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-2')}
            >
              Buat Berulang
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
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
                <TableRow
                  key={s.id}
                  className={s.isHoliday ? 'bg-destructive/10' : ''}
                >
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
  const { getTerms } = await import('@/features/term/actions');
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
        <h1 className="text-2xl font-semibold text-foreground">Sesi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih term untuk melihat sesi
        </p>
      </div>

      {terms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyState
              title="Belum ada term. Buat term terlebih dahulu."
              actionLabel="Tambah Term"
              actionHref="/dashboard/owner/term/create"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/owner/session?termId=${t.id}`}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{t.name}</h3>
                {t.isActive && (
                  <Badge variant="default" className="ml-2">
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.startDate} — {t.endDate}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.sessions.length} sesi
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
