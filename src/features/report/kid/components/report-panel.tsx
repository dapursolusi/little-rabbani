'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  MONTHLY_REPORT_STATUS,
  MonthlyReportStatus,
} from '@/features/report/constants';
import { formatDate } from '@/utils/date';
import {
  AiBrain01Icon,
  FloppyDiskIcon,
  NoteEditIcon,
  SendIcon,
  TickDouble03Icon,
  UndoIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { getStatusBadge } from '@/components/get-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import * as kidReportAction from '../actions';
import { NarrativePreview } from './narrative-preview';

export interface MonthlyInitialReport {
  id: string;
  narrative: string | null;
  reportStatus: MonthlyReportStatus;
  isEdited: boolean;
  sentAt: Date | null;
}

interface KidReportPanelProps {
  currentKidId: string;
  currentTermId: string;
  currentMonth: string;
  initialReport: MonthlyInitialReport | null;
}

/**
 * Monthly narrative workflow for one kid/month: generate/regenerate, edit,
 * review, send — plus the single-level undo. Owns the report lifecycle state;
 * the page-level client only decides whether this panel renders (final months
 * defer to termly reporting).
 */
export default function KidReportPanel({
  currentKidId,
  currentTermId,
  currentMonth,
  initialReport,
}: KidReportPanelProps) {
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

  return (
    <>
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

      {/* Destructive confirmation before undo discards the current edits */}
      <ConfirmationDialog
        open={showUndoConfirm}
        onOpenChange={setShowUndoConfirm}
        title="Batalkan perubahan?"
        description={`Editor akan kembali ke konten terakhir yang ${isDirty ? 'tersimpan' : 'diganti oleh regenerate'}. Perubahan yang sedang Anda tulis akan hilang.`}
        confirmLabel="Ya, Batalkan Perubahan"
        onConfirm={handleUndo}
      />

      {/* Destructive confirmation before regeneration replaces saved content */}
      <ConfirmationDialog
        open={showRegenConfirm}
        onOpenChange={setShowRegenConfirm}
        title="Ganti laporan dengan draft AI baru?"
        description={
          isDirty
            ? 'Perubahan yang belum disimpan di editor akan hilang dan diganti sepenuhnya oleh draft AI baru. Setelah selesai Anda dapat membatalkannya dengan Undo.'
            : `Laporan yang tersimpan saat ini — termasuk ${
                isReviewed ? 'hasil review' : 'perubahan manual Anda'
              } — akan diganti sepenuhnya oleh draft AI baru dan statusnya kembali menjadi Draft. Setelah selesai Anda dapat membatalkannya dengan Undo.`
        }
        confirmLabel="Ya, Ganti Laporan"
        onConfirm={handleGenerate}
      />

      {/* Explicit confirmation before marking a report sent */}
      <ConfirmationDialog
        open={showSendConfirm}
        onOpenChange={setShowSendConfirm}
        title="Kirim laporan ini?"
        description="Setelah ditandai terkirim, laporan tidak dapat diedit, diregenerate, atau dihapus lagi. Pastikan isi laporan sudah sesuai sebelum melanjutkan."
        confirmLabel="Ya, Kirim Laporan"
        onConfirm={handleSend}
      />
    </>
  );
}
