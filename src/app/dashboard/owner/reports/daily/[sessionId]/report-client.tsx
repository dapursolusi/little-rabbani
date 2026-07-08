'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ChevronDownIcon, Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import {
  generateDailyReports,
  getDailyReportDetail,
  markDailyReportSent,
  updateDailyReportNarrative,
} from '@/lib/actions/daily-report';
import type { IStructuredData } from '@/lib/actions/daily-report';

// ─────────────── Types ───────────────

interface IKid {
  id: string;
  name: string;
}

interface IReport {
  id: string;
  kidId: string;
  structuredJson: unknown;
  narrativeAiDraft: string | null;
  narrativeFinal: string | null;
  status: 'draft' | 'sent' | 'stale';
  generatedAt: Date | string;
}

interface IDailyReportClientProps {
  sessionId: string;
  kids: IKid[];
  initialReports: IReport[];
}

// ─────────────── Helpers ───────────────

function getMoodLabel(mood: number): string {
  const labels: Record<number, string> = {
    1: 'Sangat Tidak Baik 😢',
    2: 'Kurang Baik 😟',
    3: 'Biasa Saja 😐',
    4: 'Baik 😊',
    5: 'Sangat Baik 🤩',
  };
  return labels[mood] ?? `${mood}/5`;
}

function translateAppetite(value: string): string {
  const map: Record<string, string> = {
    good: 'Baik',
    moderate: 'Cukup',
    poor: 'Kurang',
  };
  return map[value] ?? value;
}

function translatePresence(value: string): string {
  const map: Record<string, string> = {
    present_full: 'Hadir Penuh',
    late: 'Datang Terlambat',
    early_pickup: 'Dijemput Lebih Awal',
    absent: 'Tidak Hadir',
  };
  return map[value] ?? value;
}

function translateAbsenceReason(value: string | null): string {
  const map: Record<string, string> = {
    sick: 'Sakit',
    family: 'Keperluan Keluarga',
    permission: 'Izin',
    other: 'Alasan Lain',
  };
  return value ? (map[value] ?? value) : '';
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return (
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 bg-amber-50"
        >
          Draft
        </Badge>
      );
    case 'sent':
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 hover:bg-green-100"
        >
          ✓ Terkirim
        </Badge>
      );
    case 'stale':
      return (
        <Badge
          variant="default"
          className="bg-purple-100 text-purple-700 hover:bg-purple-100"
        >
          ⚠️ Perlu Diperbarui
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ─────────────── Component ───────────────

export function DailyReportClient({
  sessionId,
  kids,
  initialReports,
}: IDailyReportClientProps) {
  const router = useRouter();
  const [reports, setReports] = useState<IReport[]>(initialReports);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedKidId, setExpandedKidId] = useState<string | null>(null);
  const [expandedReportDetail, setExpandedReportDetail] = useState<{
    kidId: string;
    kidName: string;
    structuredData: IStructuredData | null;
    narrative: string;
    status: 'draft' | 'sent' | 'stale';
    reportId: string;
  } | null>(null);
  const [editNarrative, setEditNarrative] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showClipboardModal, setShowClipboardModal] = useState(false);
  const [clipboardText, setClipboardText] = useState('');

  // ────────────────── Generation ──────────────────

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    try {
      const result = await generateDailyReports(sessionId);

      if (!result.success) {
        toast.error(result.error);
        setIsGenerating(false);
        return;
      }

      // Show per-kid results
      const results = result.data;

      // Immediately update local state so reports appear without waiting for navigation
      setReports((prev) => {
        const updated = new Map(prev.map((r) => [r.kidId, r]));
        for (const r of results) {
          if (r.status === 'success' && r.reportId) {
            updated.set(r.kidId, {
              id: r.reportId,
              kidId: r.kidId,
              structuredJson: '',
              narrativeAiDraft: null,
              narrativeFinal: null,
              status: 'draft',
              generatedAt: new Date(),
            });
          }
        }
        return Array.from(updated.values());
      });

      toast.success('Laporan berhasil dibuat');

      // Refresh to sync with server
      router.refresh();

      for (const r of results) {
        if (r.status === 'skipped') {
          toast.info(
            r.message ?? `Tidak ada data observasi untuk ${r.kidName}`
          );
        } else if (r.status === 'error') {
          toast.error(r.message ?? `Gagal membuat laporan untuk ${r.kidName}`);
        }
      }
    } catch {
      toast.error('Gagal membuat laporan');
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, router]);

  // ────────────────── Expand/Collapse Report ──────────────────

  const handleExpandReport = useCallback(
    async (kidId: string, kidName: string) => {
      if (expandedKidId === kidId) {
        setExpandedKidId(null);
        setExpandedReportDetail(null);
        return;
      }

      // Check if report exists
      const report = reports.find((r) => r.kidId === kidId);
      if (!report) {
        toast.info(
          `Belum ada laporan untuk ${kidName}. Buat laporan terlebih dahulu.`
        );
        return;
      }

      setExpandedKidId(kidId);

      const detailResult = await getDailyReportDetail(kidId, sessionId);
      if (!detailResult.success) {
        toast.error(detailResult.error);
        setExpandedKidId(null);
        return;
      }

      const detail = detailResult.data;
      const narrative = detail.narrativeFinal ?? detail.narrativeAiDraft ?? '';

      setExpandedReportDetail({
        kidId,
        kidName,
        structuredData: detail.structuredData,
        narrative,
        status: detail.status as 'draft' | 'sent' | 'stale',
        reportId: detail.id,
      });
      setEditNarrative(narrative);
    },
    [reports, sessionId, expandedKidId]
  );

  // ────────────────── Edit Narrative ──────────────────

  const handleSaveNarrative = useCallback(async () => {
    if (!expandedReportDetail) return;

    setIsSaving(true);
    try {
      const result = await updateDailyReportNarrative(
        expandedReportDetail.kidId,
        sessionId,
        editNarrative
      );

      if (result.success) {
        toast.success('Narasi berhasil disimpan');

        // Update local state
        setExpandedReportDetail((prev) =>
          prev
            ? {
                ...prev,
                narrative: editNarrative,
                status: result.data.status as 'draft' | 'sent' | 'stale',
              }
            : null
        );

        // Update reports list
        setReports((prev) =>
          prev.map((r) =>
            r.kidId === expandedReportDetail.kidId
              ? {
                  ...r,
                  narrativeFinal: editNarrative,
                  status: result.data.status as 'draft' | 'sent' | 'stale',
                }
              : r
          )
        );

        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Gagal menyimpan narasi');
    } finally {
      setIsSaving(false);
    }
  }, [expandedReportDetail, sessionId, editNarrative, router]);

  // ────────────────── Copy to Clipboard ──────────────────

  const buildFullReportText = useCallback(
    (
      structuredData: IStructuredData | null,
      narrative: string,
      kidName: string
    ): string => {
      const lines: string[] = [];
      lines.push(`LAPORAN HARIAN — ${kidName}`);
      lines.push('');

      if (structuredData) {
        lines.push(`Suasana Hati: ${getMoodLabel(structuredData.mood)}`);
        lines.push(
          `Nafsu Makan: ${translateAppetite(structuredData.appetite)}`
        );
        lines.push(`Kehadiran: ${translatePresence(structuredData.presence)}`);

        if (structuredData.absenceReason) {
          lines.push(
            `Alasan Tidak Hadir: ${translateAbsenceReason(structuredData.absenceReason)}`
          );
        }

        if (structuredData.activities.length > 0) {
          lines.push(`Aktivitas: ${structuredData.activities.join(', ')}`);
        } else {
          lines.push('Aktivitas: Tidak ada aktivitas tercatat');
        }

        if (structuredData.notes.length > 0) {
          lines.push(`Catatan Guru: ${structuredData.notes.join('. ')}`);
        }

        lines.push('');
      }

      if (narrative) {
        lines.push('NARASI:');
        lines.push(narrative);
      }

      return lines.join('\n');
    },
    []
  );

  const handleCopyToClipboard = useCallback(async () => {
    if (!expandedReportDetail) return;

    const text = buildFullReportText(
      expandedReportDetail.structuredData,
      expandedReportDetail.narrative,
      expandedReportDetail.kidName
    );

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Laporan berhasil disalin ke clipboard');
    } catch {
      // Clipboard API blocked — fallback modal
      setClipboardText(text);
      setShowClipboardModal(true);
    }
  }, [expandedReportDetail, editNarrative, buildFullReportText]);

  // ────────────────── Mark Sent ──────────────────

  const handleMarkSent = useCallback(async () => {
    if (!expandedReportDetail) return;

    try {
      const result = await markDailyReportSent(
        expandedReportDetail.kidId,
        sessionId
      );

      if (result.success) {
        toast.success('Laporan ditandai terkirim');
        setExpandedReportDetail((prev) =>
          prev ? { ...prev, status: 'sent' } : null
        );
        setReports((prev) =>
          prev.map((r) =>
            r.kidId === expandedReportDetail.kidId
              ? { ...r, status: 'sent' as const }
              : r
          )
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Gagal menandai laporan');
    }
  }, [expandedReportDetail, sessionId, router]);

  // ────────────────── Render ──────────────────

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {kids.length} murid terdaftar • {reports.length} laporan tersimpan
        </p>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="min-w-[180px]"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Loading03Icon}
                className="h-4 w-4 animate-spin"
              />
              Membuat Laporan...
            </span>
          ) : (
            'Buat Laporan'
          )}
        </Button>
      </div>

      {/* Kid List */}
      <div className="space-y-2">
        {kids.map((kid) => {
          const report = reports.find((r) => r.kidId === kid.id);
          const isExpanded = expandedKidId === kid.id;

          return (
            <div key={kid.id}>
              {/* Kid row */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleExpandReport(kid.id, kid.name)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:shadow-sm h-auto ${
                  isExpanded
                    ? 'border-primary bg-blue-50'
                    : report
                      ? 'border-zinc-200 bg-white'
                      : 'border-dashed border-zinc-300 bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-zinc-900">{kid.name}</span>
                  {report ? (
                    getStatusBadge(report.status)
                  ) : (
                    <span className="text-xs text-zinc-400">
                      Belum ada laporan
                    </span>
                  )}
                </div>
                <HugeiconsIcon
                  icon={ChevronDownIcon}
                  className={`h-5 w-5 text-zinc-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </Button>

              {/* Expanded report detail */}
              {isExpanded && expandedReportDetail && (
                <div className="mt-2 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
                  {/* Status */}
                  <div className="mb-4 flex items-center gap-2">
                    {getStatusBadge(expandedReportDetail.status)}
                  </div>

                  {/* Structured data (read-only) */}
                  {expandedReportDetail.structuredData && (
                    <div className="mb-6 space-y-3 rounded-lg bg-zinc-50 p-4">
                      <h3 className="text-sm font-medium text-zinc-700">
                        Data Observasi
                      </h3>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <span className="text-xs text-zinc-500">
                            Suasana Hati
                          </span>
                          <p className="text-sm font-medium text-zinc-800">
                            {getMoodLabel(
                              expandedReportDetail.structuredData.mood
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-zinc-500">
                            Nafsu Makan
                          </span>
                          <p className="text-sm font-medium text-zinc-800">
                            {translateAppetite(
                              expandedReportDetail.structuredData.appetite
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-zinc-500">
                            Kehadiran
                          </span>
                          <p className="text-sm font-medium text-zinc-800">
                            {translatePresence(
                              expandedReportDetail.structuredData.presence
                            )}
                          </p>
                        </div>
                        {expandedReportDetail.structuredData.absenceReason && (
                          <div>
                            <span className="text-xs text-zinc-500">
                              Alasan Tidak Hadir
                            </span>
                            <p className="text-sm font-medium text-zinc-800">
                              {translateAbsenceReason(
                                expandedReportDetail.structuredData
                                  .absenceReason
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Activities */}
                      <div>
                        <span className="text-xs text-zinc-500">Aktivitas</span>
                        {expandedReportDetail.structuredData.activities.length >
                        0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {expandedReportDetail.structuredData.activities.map(
                              (activity, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-700"
                                >
                                  {activity}
                                </Badge>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-zinc-500 italic">
                            Tidak ada aktivitas tercatat
                          </p>
                        )}
                      </div>

                      {/* Notes */}
                      {expandedReportDetail.structuredData.notes.length > 0 && (
                        <div>
                          <span className="text-xs text-zinc-500">
                            Catatan Guru
                          </span>
                          <ul className="mt-1 list-inside list-disc text-sm text-zinc-700">
                            {expandedReportDetail.structuredData.notes.map(
                              (note, idx) => (
                                <li key={idx}>{note}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Editable Narrative */}
                  <div className="mb-4 space-y-2">
                    <label
                      htmlFor={`narrative-${expandedReportDetail.kidId}`}
                      className="text-sm font-medium text-zinc-700"
                    >
                      Narasi (dapat diedit)
                    </label>
                    <Textarea
                      id={`narrative-${expandedReportDetail.kidId}`}
                      value={editNarrative}
                      onChange={(e) => setEditNarrative(e.target.value)}
                      rows={6}
                      placeholder={
                        !expandedReportDetail.narrative
                          ? 'Narasi tidak tersedia — tulis manual...'
                          : 'Edit narasi...'
                      }
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveNarrative}
                        disabled={
                          isSaving ||
                          editNarrative === expandedReportDetail.narrative
                        }
                      >
                        {isSaving ? 'Menyimpan...' : 'Simpan Narasi'}
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                    >
                      📋 Salin Laporan
                    </Button>

                    {expandedReportDetail.status === 'draft' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleMarkSent}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✓ Tandai Terkirim
                      </Button>
                    )}

                    {expandedReportDetail.status === 'stale' && (
                      <span className="flex items-center text-xs text-purple-600">
                        ⚠️ Laporan perlu ditandai terkirim kembali setelah
                        diedit
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clipboard Fallback Modal */}
      <Dialog open={showClipboardModal} onOpenChange={setShowClipboardModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Salin Laporan</DialogTitle>
            <DialogDescription>
              Salin teks di bawah ini secara manual (clipboard API tidak
              tersedia)
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-md border bg-zinc-50 p-4 text-sm text-zinc-800">
            {clipboardText}
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => {
                // Try selecting the text for easy copy
                setShowClipboardModal(false);
              }}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
