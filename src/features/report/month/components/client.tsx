'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import * as kidReportAction from '@/features/report/kid/actions';
import { ClassReportKid, ClassReportOverview } from '@/features/report/types';
import { buildReportableMonths } from '@/features/report/utils';
import { Term } from '@/features/term/types';
import { formatDate } from '@/utils/date';
import { pushParam } from '@/utils/search-params';
import {
  Alert01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';
import ClassSessionSelector from '@/components/features/class-session/class-session-selector';
import TermSelector from '@/components/features/term/term-selector';
import { getStatusBadge } from '@/components/get-status-badge';
import { ConfirmDialog } from '@/components/sections/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthlyReportClientProps {
  terms: Term[];
  classSessions: ClassSession[];
  currentTermId: string;
  currentClassSessionId: string;
  currentMonth: string;
  overview: ClassReportOverview;
}

function MonthSelector({
  term,
  currentMonth,
}: {
  term: Term;
  currentMonth: string;
}) {
  const router = useRouter();
  // Only months that have already started can be reported on.
  const months = buildReportableMonths([term]);

  return (
    <div className="mb-1.5 flex flex-col items-start gap-3">
      <Label
        htmlFor="month-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Bulan
      </Label>
      <Select
        value={currentMonth}
        onValueChange={(month) =>
          month && pushParam({ key: 'month', value: month, router })
        }
      >
        <SelectTrigger id="month-select" className="w-full">
          <SelectValue>{formatDate(currentMonth)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {formatDate(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function ReadinessBadge({ kid }: { kid: ClassReportKid }) {
  if (!kid.ready) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 text-destructive"
      >
        <HugeiconsIcon icon={Alert01Icon} data-icon="inline-start" />
        Data kurang
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-success/30 text-success">
      <HugeiconsIcon icon={CheckmarkCircle01Icon} data-icon="inline-start" />
      Siap
    </Badge>
  );
}

// Temporary batch-operation states — not persisted report lifecycle statuses.
type BatchStatus = 'waiting' | 'generating' | 'success' | 'skipped' | 'failed';

interface BatchEntry {
  status: BatchStatus;
  /** Safe, server-provided failure message (never a raw provider error). */
  message?: string;
}

function BatchBadge({ entry }: { entry: BatchEntry }) {
  if (entry.status === 'generating' || entry.status === 'waiting') {
    return (
      <Badge variant="secondary">
        <HugeiconsIcon
          icon={Loading03Icon}
          data-icon="inline-start"
          className="animate-spin"
        />
        {entry.status === 'generating' ? 'Membuat...' : 'Menunggu'}
      </Badge>
    );
  }

  if (entry.status === 'success') {
    return (
      <Badge variant="outline" className="border-success/30 text-success">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} data-icon="inline-start" />
        Dibuat
      </Badge>
    );
  }

  if (entry.status === 'skipped') {
    return (
      <Badge variant="secondary">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} data-icon="inline-start" />
        Dilewati
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-destructive/30 text-destructive">
      <HugeiconsIcon icon={Alert01Icon} data-icon="inline-start" />
      Gagal
    </Badge>
  );
}

function ChildItem({
  kid,
  termId,
  month,
  isFinalMonth,
  batchEntry,
  onRetry,
  retryDisabled,
}: {
  kid: ClassReportKid;
  termId: string;
  month: string;
  isFinalMonth: boolean;
  batchEntry?: BatchEntry;
  onRetry?: () => void;
  retryDisabled?: boolean;
}) {
  const href = `/dashboard/report/kid/${kid.kidId}?termId=${termId}&month=${month}`;
  const generatedInBatch =
    batchEntry?.status === 'success' || batchEntry?.status === 'skipped';

  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>{kid.name}</ItemTitle>
        {kid.nickName && <ItemDescription>{kid.nickName}</ItemDescription>}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <ReadinessBadge kid={kid} />
          {batchEntry ? (
            <BatchBadge entry={batchEntry} />
          ) : kid.reportStatus ? (
            getStatusBadge(kid.reportStatus)
          ) : (
            <Badge variant="secondary">Belum dibuat</Badge>
          )}
          {kid.isEdited && <Badge variant="secondary">Diedit manual</Badge>}
        </div>
        {!kid.ready && kid.readinessReason && (
          <ItemDescription className="pt-1">
            {kid.readinessReason}
          </ItemDescription>
        )}
        {batchEntry?.status === 'failed' && batchEntry.message && (
          <ItemDescription className="pt-1 text-destructive">
            {batchEntry.message}
          </ItemDescription>
        )}
      </ItemContent>
      {kid.reportStatus || generatedInBatch ? (
        <ItemActions>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={href} />}
          >
            Buka laporan
          </Button>
        </ItemActions>
      ) : batchEntry?.status === 'failed' ? (
        <ItemActions>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={retryDisabled}
          >
            Coba lagi
          </Button>
        </ItemActions>
      ) : (
        // The final month uses termly reporting — generation is refused
        // there, so a "create" action would open a dead end.
        kid.ready &&
        !isFinalMonth && (
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={href} />}
            >
              Buat laporan
            </Button>
          </ItemActions>
        )
      )}
    </Item>
  );
}

export default function MonthlyReportClient({
  terms,
  classSessions,
  currentTermId,
  currentClassSessionId,
  currentMonth,
  overview,
}: MonthlyReportClientProps) {
  const router = useRouter();
  const term = terms.find((t) => t.id === currentTermId);
  const { kids, summary } = overview;

  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [batchEntries, setBatchEntries] = useState<Record<string, BatchEntry>>(
    {}
  );
  // Batch state belongs to one term/month/class triple. A selection change must
  // not carry old successes (or failures) into a different scope's eligibility.
  const batchScope = `${currentTermId}:${currentMonth}:${currentClassSessionId}`;
  const [batchState, setBatchState] = useState<{ scope: string }>({
    scope: batchScope,
  });
  if (batchState.scope !== batchScope) {
    setBatchState({ scope: batchScope });
    setBatchEntries({});
    setShowBatchConfirm(false);
  }
  // A run started under a previous scope must stop writing into the new one.
  const batchScopeRef = useRef(batchScope);
  useEffect(() => {
    batchScopeRef.current = batchScope;
  }, [batchScope]);
  // Null when idle; {current,total} while a batch runs.
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const isBatchRunning = batchProgress !== null;

  // Eligible = enough data, no report yet, and not already produced by this
  // batch. Server state wins on reload; local success closes the loop without
  // waiting for the refresh.
  const candidates = kids.filter(
    (kid) =>
      kid.ready &&
      !kid.reportStatus &&
      batchEntries[kid.kidId]?.status !== 'success'
  );

  const successCount = Object.values(batchEntries).filter(
    (entry) => entry.status === 'success'
  ).length;
  const skippedCount = Object.values(batchEntries).filter(
    (entry) => entry.status === 'skipped'
  ).length;
  const failedCount = Object.values(batchEntries).filter(
    (entry) => entry.status === 'failed'
  ).length;
  const batchFinished =
    !isBatchRunning && successCount + skippedCount + failedCount > 0;

  const classLabel =
    classSessions.find((session) => session.id === currentClassSessionId)
      ?.name ?? 'Semua kelas';
  const periodLabel = `${classLabel}, ${formatDate(currentMonth)}`;

  // Sequential, client-orchestrated: one server request per child, each
  // awaited before the next. A failure is recorded and the run continues.
  async function runBatch(kidIds: string[]) {
    // Snapshot the scope this run belongs to; a selection change during the
    // run resets batch state, and stale results must not repopulate it.
    const runScope = batchScope;
    const inRunScope = () => batchScopeRef.current === runScope;
    let runSuccesses = 0;
    setBatchProgress({ current: 0, total: kidIds.length });
    setBatchEntries((prev) => {
      const next = { ...prev };
      for (const kidId of kidIds) next[kidId] = { status: 'waiting' };
      return next;
    });

    for (const [index, kidId] of kidIds.entries()) {
      if (!inRunScope()) break;
      setBatchProgress({ current: index + 1, total: kidIds.length });
      setBatchEntries((prev) => ({
        ...prev,
        [kidId]: { status: 'generating' },
      }));
      try {
        const result = await kidReportAction.generateMonthlyReportForBatch({
          kidId,
          termId: currentTermId,
          yearMonth: currentMonth,
        });
        if (!inRunScope()) break;
        setBatchEntries((prev) => ({
          ...prev,
          [kidId]: result.success
            ? { status: 'success' }
            : result.error?.type === 'conflict'
              ? // Created concurrently or already persisted — not a failure.
                { status: 'skipped' }
              : { status: 'failed', message: result.message },
        }));
        if (result.success) runSuccesses += 1;
      } catch {
        if (!inRunScope()) break;
        setBatchEntries((prev) => ({
          ...prev,
          [kidId]: {
            status: 'failed',
            message: 'Terjadi kesalahan. Silahkan coba lagi',
          },
        }));
      }
    }

    if (!inRunScope()) return;
    setBatchProgress(null);
    // Persisted reports and readiness now come from the server.
    router.refresh();
    if (runSuccesses === 0) {
      toast.error('Tidak ada laporan yang berhasil dibuat');
    } else {
      toast.success('Pembuatan laporan massal selesai');
    }
  }

  function handleConfirmBatch() {
    setShowBatchConfirm(false);
    if (candidates.length === 0) return;
    void runBatch(candidates.map((kid) => kid.kidId));
  }

  return (
    <div>
      <TermSelector
        terms={terms}
        value={currentTermId || undefined}
        onValueChange={(termId) => {
          // A month and class belong to a term; drop stale selections with it.
          const params = new URLSearchParams(window.location.search);
          params.delete('month');
          params.delete('classSessionId');
          params.set('termId', termId);
          router.push(`?${params.toString()}`);
        }}
      />
      <ClassSessionSelector
        classSessions={classSessions}
        value={currentClassSessionId}
        onValueChange={(classSessionId) =>
          pushParam({ key: 'classSessionId', value: classSessionId, router })
        }
      />
      {term && <MonthSelector term={term} currentMonth={currentMonth} />}

      {!currentTermId ? (
        <p className="pt-4">Pilih batch terlebih dahulu!</p>
      ) : kids.length === 0 ? (
        <EmptyState
          title="Belum ada anak di kelas ini"
          description="Tidak ada anak terdaftar pada batch dan sesi kelas yang dipilih."
        />
      ) : (
        <div className="flex flex-col gap-4 pt-4">
          {overview.isFinalMonth && (
            <p className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
              Bulan terakhir batch menggunakan laporan triwulanan, bukan laporan
              bulanan.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Total anak" value={summary.totalKids} />
            <SummaryStat label="Laporan ada" value={summary.withReport} />
            <SummaryStat
              label="Siap dibuat"
              value={summary.eligibleWithoutReport}
            />
            <SummaryStat
              label="Data kurang"
              value={summary.insufficientWithoutReport}
            />
          </div>

          {summary.withReport === 0 && (
            <p className="text-sm text-muted-foreground">
              Belum ada laporan yang dibuat
            </p>
          )}

          {isBatchRunning && batchProgress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon
                icon={Loading03Icon}
                className="size-4 animate-spin"
              />
              Membuat {batchProgress.current} dari {batchProgress.total}
            </div>
          )}

          {batchFinished && (
            <p className="text-sm font-medium text-foreground">
              Selesai: {successCount} berhasil
              {skippedCount > 0 ? `, ${skippedCount} dilewati` : ''}
              {failedCount > 0 ? `, ${failedCount} gagal` : ''} dari{' '}
              {successCount + skippedCount + failedCount} anak.
            </p>
          )}

          {candidates.length > 0 &&
            !isBatchRunning &&
            !overview.isFinalMonth && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  className="w-full sm:w-fit"
                  onClick={() => setShowBatchConfirm(true)}
                >
                  Buat laporan tersisa ({candidates.length})
                </Button>
                <p className="text-xs text-muted-foreground">
                  Laporan yang sudah ada tidak akan dibuat ulang.
                </p>
              </div>
            )}

          <ConfirmDialog
            open={showBatchConfirm}
            onOpenChange={setShowBatchConfirm}
            onConfirm={handleConfirmBatch}
            title="Buat laporan untuk anak yang siap?"
            description={`${candidates.length} laporan akan dibuat. ${
              summary.withReport
            } laporan sudah ada dan dilewati. ${
              summary.insufficientWithoutReport
            } anak datanya kurang. ${periodLabel}.`}
            confirmText="Ya, Buat"
            cancelText="Batal"
            variant="default"
          />

          <ItemGroup>
            {kids.map((kid) => (
              <ChildItem
                key={kid.kidId}
                kid={kid}
                termId={currentTermId}
                month={currentMonth}
                isFinalMonth={overview.isFinalMonth}
                batchEntry={batchEntries[kid.kidId]}
                onRetry={() => void runBatch([kid.kidId])}
                retryDisabled={isBatchRunning}
              />
            ))}
          </ItemGroup>
        </div>
      )}
    </div>
  );
}
