'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '@/features/daily-class-report/constants';
import {
  MONTHLY_REPORT_STATUS,
  MonthlyReportStatus,
} from '@/features/report/constants';
import { Term } from '@/features/term/types';
import { formatDate } from '@/utils/date';
import { pushParam } from '@/utils/search-params';
import {
  AiBrain01Icon,
  ChevronDown,
  FloppyDiskIcon,
  NoteEditIcon,
  SendIcon,
  SquareChevronLeftIcon,
  SquareChevronRightIcon,
  TickDouble03Icon,
  UndoIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import TermSelectorBase from '@/components/features/term/term-selector';
import { getStatusBadge } from '@/components/shared/get-status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import * as kidReportAction from '../actions';
import { MonthlyAcademicDetails, MonthlyKidReportDetail } from '../types';

interface MonthlyInitialReport {
  id: string;
  narrative: string | null;
  reportStatus: MonthlyReportStatus;
  isEdited: boolean;
  sentAt: Date | null;
}

interface KidReportClientProps {
  currentKidId: string;
  currentTermId: string;
  currentMonth: string;
  /** Previous eligible month, or null at the earliest boundary. */
  prevMonth: string | null;
  /** Next eligible month, or null at the latest boundary. */
  nextMonth: string | null;
  /** Terms the kid is enrolled in that overlap the selected month. */
  terms: Term[];
  /** Selected term's final month → termly reporting, not monthly narrative. */
  isFinalMonth: boolean;
  kidDetails: MonthlyKidReportDetail;
  academicDetails: MonthlyAcademicDetails;
  initialReport: MonthlyInitialReport | null;
}

function TermSelector({
  terms,
  value,
  currentMonth,
}: {
  terms: Term[];
  value: string;
  currentMonth: string;
}) {
  const router = useRouter();
  // One eligible term in this month → nothing to choose, lock the selector.
  const isLocked = terms.length < 2;
  return (
    <TermSelectorBase
      terms={terms}
      value={value}
      disabled={isLocked}
      onValueChange={(termId) => {
        const params = new URLSearchParams(window.location.search);
        params.set('termId', termId);
        params.set('month', currentMonth);
        router.push(`?${params.toString()}`);
      }}
    />
  );
}

function MonthPicker({
  currentMonth,
  prevMonth,
  nextMonth,
}: {
  currentMonth: string;
  prevMonth: string | null;
  nextMonth: string | null;
}) {
  const router = useRouter();
  const goTo = (month: string) =>
    pushParam({ key: 'month', value: month, router });

  return (
    <div className="my-2 flex items-center justify-between border-2 rounded-xl">
      <Tooltip>
        <TooltipTrigger
          render={
            <span>
              <Button
                aria-label="Bulan sebelumnya"
                className="w-fit"
                disabled={!prevMonth}
                onClick={() => prevMonth && goTo(prevMonth)}
              >
                <HugeiconsIcon icon={SquareChevronLeftIcon} size={100} />
              </Button>
            </span>
          }
        />
        {!prevMonth && (
          <TooltipContent>Tidak ada laporan sebelumnya</TooltipContent>
        )}
      </Tooltip>
      <span>{formatDate(currentMonth)}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <span>
              <Button
                aria-label="Bulan berikutnya"
                className="w-fit"
                disabled={!nextMonth}
                onClick={() => nextMonth && goTo(nextMonth)}
              >
                <HugeiconsIcon icon={SquareChevronRightIcon} size={100} />
              </Button>
            </span>
          }
        />
        {!nextMonth && (
          <TooltipContent>Tidak ada laporan setelah bulan ini</TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}

/**
 * Readable renderer for the persisted narrative: blank-line separated
 * paragraphs, `Heading:` lines, and `- ` bullets. Manual edits that do not
 * follow the shape still render as plain paragraphs.
 */
function NarrativePreview({ narrative }: { narrative: string }) {
  const lines = narrative.split('\n');

  if (!narrative.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada narasi laporan untuk bulan ini.
      </p>
    );
  }

  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
      continue;
    }

    flushBullets();
    if (!line) continue;

    if (line.endsWith(':')) {
      blocks.push(
        <h3 key={`h-${blocks.length}`} className="mt-4 font-semibold">
          {line}
        </h3>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-relaxed">
        {line}
      </p>
    );
  }
  flushBullets();

  return <div className="space-y-3 text-sm sm:text-base">{blocks}</div>;
}

export default function KidReportClient({
  currentKidId,
  currentTermId,
  currentMonth,
  prevMonth,
  nextMonth,
  terms,
  isFinalMonth,
  kidDetails,
  academicDetails,
  initialReport,
}: KidReportClientProps) {
  const router = useRouter();
  const [hasReport, setHasReport] = useState(!!initialReport);
  const [reportStatus, setReportStatus] = useState<MonthlyReportStatus | null>(
    initialReport?.reportStatus ?? null
  );
  const [isEdited, setIsEdited] = useState(initialReport?.isEdited ?? false);
  const [sentAt, setSentAt] = useState<Date | null>(
    initialReport?.sentAt ?? null
  );
  // What the DB holds right now — baseline for the dirty check.
  const [savedNarrative, setSavedNarrative] = useState(
    initialReport?.narrative ?? ''
  );
  const [narrative, setNarrative] = useState(initialReport?.narrative ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  // Content before the latest regeneration — the single-level undo baseline.
  const [undoNarrative, setUndoNarrative] = useState<string | null>(null);
  const [tab, setTab] = useState(initialReport ? 'preview' : 'editor');

  const isSent = reportStatus === MONTHLY_REPORT_STATUS.SENT;
  const isReviewed = reportStatus === MONTHLY_REPORT_STATUS.REVIEWED;
  const isDirty = narrative !== savedNarrative;
  const isBusy = isGenerating || isSaving || isReviewing || isSending;

  // Regeneration protection: unsaved edits, saved manual edits, and a
  // completed review are all destroyed by a replacement draft, so each needs
  // explicit confirmation. The prior content is kept for a one-step undo.
  const regenNeedsConfirm = isDirty || (hasReport && (isEdited || isReviewed));

  // Undo restores the most recent baseline: the persisted content when there
  // are unsaved edits, otherwise the pre-regeneration content.
  const undoRestores = isDirty ? savedNarrative : undoNarrative;
  const canUndo = !isSent && undoRestores !== null;

  // Final month of the selected term belongs to termly reporting. No termly
  // report module exists yet, so the link is always the create state.
  const termlyReportHref = `/dashboard/report/quarterly/${currentKidId}?termId=${currentTermId}`;

  const params = {
    kidId: currentKidId,
    termId: currentTermId,
    yearMonth: currentMonth,
  };

  async function handleGenerate() {
    setShowRegenConfirm(false);
    // Keep what the editor showed for a single-step undo — including a typed
    // first draft that has no report row yet. An empty editor has nothing to
    // restore.
    const previousNarrative = narrative.trim() ? narrative : null;
    setIsGenerating(true);
    try {
      const result = await kidReportAction.generateMonthlyReport(params);
      if (result.success) {
        // Server persisted the draft — adopt it locally only on success.
        setHasReport(true);
        setUndoNarrative(previousNarrative);
        setNarrative(result.data.narrative);
        setSavedNarrative(result.data.narrative);
        setReportStatus(MONTHLY_REPORT_STATUS.DRAFT);
        setIsEdited(false);
        setSentAt(null);
        toast.success(result.message ?? 'Draft laporan berhasil dibuat');
        router.refresh();
      } else {
        toast.error(result.message ?? 'Gagal membuat draft');
      }
    } catch {
      toast.error('Terjadi kesalahan. Silahkan coba lagi');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRegenerateClick() {
    if (regenNeedsConfirm) {
      setShowRegenConfirm(true);
      return;
    }
    handleGenerate();
  }

  // Single-level undo: restore the last baseline as an unsaved edit. Saving
  // it persists; there is no deeper history.
  function handleUndo() {
    setShowUndoConfirm(false);
    if (undoRestores === null) return;
    setNarrative(undoRestores);
    setUndoNarrative(null);
    setTab('editor');
    toast.success('Perubahan dibatalkan. Simpan untuk menyimpan.');
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await kidReportAction.saveMonthlyReportNarrative({
        ...params,
        narrative,
      });
      if (result.success) {
        setHasReport(true);
        setSavedNarrative(result.data.narrative ?? '');
        setReportStatus(result.data.reportStatus);
        setIsEdited(result.data.isEdited);
        // The saved content is the new baseline — an old undo would silently
        // discard it.
        setUndoNarrative(null);
        toast.success(
          result.message ??
            (result.data.isEdited
              ? 'Laporan berhasil disimpan'
              : 'Tidak ada perubahan untuk disimpan')
        );
        router.refresh();
      } else {
        toast.error(result.message ?? 'Gagal menyimpan laporan');
      }
    } catch {
      toast.error('Terjadi kesalahan. Silahkan coba lagi');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReview() {
    setIsReviewing(true);
    try {
      const result = await kidReportAction.reviewMonthlyReport(params);
      if (result.success) {
        setReportStatus(result.data.reportStatus);
        toast.success(result.message ?? 'Laporan ditandai sudah direview');
        router.refresh();
      } else {
        toast.error(result.message ?? 'Gagal menandai laporan direview');
      }
    } catch {
      toast.error('Terjadi kesalahan. Silahkan coba lagi');
    } finally {
      setIsReviewing(false);
    }
  }

  // Once sent, the editor tab is gone — force the readable preview.
  function handleTabChange(value: unknown) {
    if (typeof value === 'string') setTab(value);
  }

  async function handleSend() {
    setShowSendConfirm(false);
    setIsSending(true);
    try {
      const result = await kidReportAction.sendMonthlyReport(params);
      if (result.success) {
        setReportStatus(result.data.reportStatus);
        setSentAt(result.data.sentAt);
        toast.success(result.message ?? 'Laporan berhasil dikirim');
        router.refresh();
      } else {
        toast.error(result.message ?? 'Gagal mengirim laporan');
      }
    } catch {
      toast.error('Terjadi kesalahan. Silahkan coba lagi');
    } finally {
      setIsSending(false);
    }
  }

  const totalAttendance = kidDetails?.dcrObservations.filter(
    (obs) => obs.attendance === KID_ATTENDANCE.PRESENT
  ).length;

  return (
    <div>
      {/* Kid Info & Batch Selector  */}
      <div className="flex items-center justify-around gap-4 min-w-full w-full p-4 border-2 rounded-xl">
        <Avatar size="lg">
          <AvatarImage></AvatarImage>
          <AvatarFallback>TEST</AvatarFallback>
        </Avatar>
        <div></div>
        {`(${kidDetails?.nickName}) ${kidDetails?.name}`}
        <TermSelector
          terms={terms}
          value={currentTermId}
          currentMonth={currentMonth}
        />
      </div>
      {/* Month Selector */}
      <MonthPicker
        currentMonth={currentMonth}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
      />
      {/* Report Content */}
      <div className="my-2 p-4 border-2 rounded-xl ">
        Ringkasan Data Observasi Bulan Ini
        {/* Summary  */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>Kehadiran</ItemTitle>
              <ItemDescription>
                <Badge>
                  {totalAttendance}/{academicDetails?.dcrs.length}
                </Badge>
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>Catatan Guru</ItemTitle>
              <ItemDescription>
                <Badge>{kidDetails?.dcrObservations.length ?? 0}</Badge>
              </ItemDescription>
            </ItemContent>
          </Item>
        </div>
        {/* History Data */}
        <Collapsible className="w-full my-2 p-3 border-2 rounded-md">
          <CollapsibleTrigger className="w-full flex items-center justify-between">
            <span>Riwayat Observasi Bulan Ini</span>
            <HugeiconsIcon icon={ChevronDown} />
          </CollapsibleTrigger>
          <CollapsibleContent className="w-full bg-accent/80 my-2 p-3 border-2 rounded-md max-h-80 overflow-auto">
            {kidDetails?.dcrObservations.map((obs) => (
              <div key={obs.id}>
                <div className="flex items-baseline gap-2 py-2">
                  <div className="min-w-25">
                    <Badge>
                      {Intl.DateTimeFormat('id-ID', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'short',
                      }).format(new Date(obs.dcr.date))}
                    </Badge>
                  </div>
                  <Separator orientation="vertical" className="" />
                  {obs.attendance === KID_ATTENDANCE.PRESENT ? (
                    <div>
                      <p className="flex items-center gap-2">
                        <span>{`⭐`}</span>
                        <Separator orientation="vertical" />
                        <span>{`Mood: ${obs.mood && KID_MOOD_LABELS[obs.mood]}`}</span>
                        <Separator orientation="vertical" />
                        <span>{`Makan: ${obs.appetite && KID_APPETITE_LABELS[obs.appetite]}`}</span>
                      </p>

                      <p>{`Catatan: ${obs.notes ?? '—'}`}</p>
                      <p>Partipasi aktif</p>
                    </div>
                  ) : (
                    <div>{KID_ATTENDANCE_LABELS[obs.attendance]}</div>
                  )}
                </div>
                <Separator />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
        {/* Generation — final month of the term defers to termly reporting */}
        {isFinalMonth ? (
          <div className="my-2 p-4 border-2 rounded-md ">
            <p className="mb-2 text-sm text-muted-foreground">
              Bulan ini adalah bulan terakhir batch. Laporan untuk orang tua
              dibuat sebagai laporan triwulanan.
            </p>
            <Button
              nativeButton={false}
              render={<Link href={termlyReportHref} />}
            >
              <HugeiconsIcon icon={NoteEditIcon} />
              Create termly report
            </Button>
          </div>
        ) : (
          <div className="my-2 p-4 border-2 rounded-md ">
            {/* Status (left) — content actions (right) */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {reportStatus && getStatusBadge(reportStatus)}
                {isEdited && !isSent && (
                  <Badge variant="secondary">Diedit manual</Badge>
                )}
                {isSent && sentAt && (
                  <span className="text-xs text-muted-foreground">
                    Dikirim{' '}
                    {Intl.DateTimeFormat('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(sentAt)}
                  </span>
                )}
              </div>
              {!isSent && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleRegenerateClick}
                    disabled={isBusy}
                    variant="outline"
                    size="sm"
                  >
                    <HugeiconsIcon icon={AiBrain01Icon} />
                    {isGenerating
                      ? 'Membuat draft...'
                      : hasReport
                        ? 'Regenerate'
                        : 'Buat Draft dengan AI'}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Tabs
                value={isSent ? 'preview' : tab}
                onValueChange={handleTabChange}
              >
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="editor" disabled={isSent}>
                      <HugeiconsIcon icon={NoteEditIcon} />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <HugeiconsIcon icon={ViewIcon} />
                      Pratinjau
                    </TabsTrigger>
                  </TabsList>

                  {!isSent && canUndo && (
                    <Button
                      onClick={() => setShowUndoConfirm(true)}
                      disabled={isBusy}
                      className="inline-flex"
                      variant="ghost"
                      size="sm"
                    >
                      <HugeiconsIcon icon={UndoIcon} />
                      Undo
                    </Button>
                  )}
                </div>

                <TabsContent value="editor">
                  <Textarea
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    readOnly={isSent}
                    className="min-h-70"
                    placeholder="Buat draft dengan AI, atau tulis manual di sini"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="rounded-xl border p-4">
                    <h2 className="mb-3 font-semibold">
                      Laporan Bulanan · {formatDate(currentMonth)}
                    </h2>
                    <NarrativePreview narrative={narrative} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {!isSent && (
              <div className="mt-3 flex flex-wrap items-center gap-2 ">
                {/* Workflow actions (left): save appears only while dirty. */}
                <div className="flex items-center gap-2 max-sm:w-full">
                  {isDirty && (
                    <Button
                      onClick={handleSave}
                      disabled={isBusy || !narrative.trim()}
                      variant="secondary"
                      className="max-sm:w-full"
                    >
                      <HugeiconsIcon icon={FloppyDiskIcon} />
                      {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  )}
                  {hasReport &&
                    !isDirty &&
                    reportStatus === MONTHLY_REPORT_STATUS.DRAFT && (
                      <Button
                        onClick={handleReview}
                        disabled={isBusy}
                        variant="secondary"
                        className="max-sm:w-full"
                      >
                        <HugeiconsIcon icon={TickDouble03Icon} />
                        {isReviewing ? 'Menandai...' : 'Tandai Direview'}
                      </Button>
                    )}
                </div>
                {/* Sending is the primary action, pinned right. */}
                <Button
                  className="ml-auto max-sm:w-full"
                  onClick={() => setShowSendConfirm(true)}
                  disabled={isBusy || !hasReport || isDirty || !isReviewed}
                >
                  <HugeiconsIcon icon={SendIcon} />
                  {isSending ? 'Mengirim...' : 'Kirim Laporan'}
                </Button>
              </div>
            )}

            {!isSent && hasReport && isDirty && (
              <p className="mt-2 text-xs text-muted-foreground">
                Simpan perubahan terlebih dahulu untuk menandai laporan direview
                atau mengirimnya.
              </p>
            )}
            {isSent && (
              <p className="mt-2 text-xs text-muted-foreground">
                Laporan sudah dikirim dan tidak dapat diubah lagi.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Destructive confirmation before undo discards the current edits */}
      <AlertDialog open={showUndoConfirm} onOpenChange={setShowUndoConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Editor akan kembali ke konten terakhir yang{' '}
              {isDirty ? 'tersimpan' : 'diganti oleh regenerate'}. Perubahan
              yang sedang Anda tulis akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleUndo}>
              Ya, Batalkan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Destructive confirmation before regeneration replaces saved content */}
      <AlertDialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ganti laporan dengan draft AI baru?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDirty
                ? 'Perubahan yang belum disimpan di editor akan hilang dan diganti sepenuhnya oleh draft AI baru. Setelah selesai Anda dapat membatalkannya dengan Undo.'
                : `Laporan yang tersimpan saat ini — termasuk ${
                    isReviewed ? 'hasil review' : 'perubahan manual Anda'
                  } — akan diganti sepenuhnya oleh draft AI baru dan statusnya kembali menjadi Draft. Setelah selesai Anda dapat membatalkannya dengan Undo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>
              Ya, Ganti Laporan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Explicit confirmation before marking a report sent */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim laporan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Setelah ditandai terkirim, laporan tidak dapat diedit,
              diregenerate, atau dihapus lagi. Pastikan isi laporan sudah sesuai
              sebelum melanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              Ya, Kirim Laporan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
