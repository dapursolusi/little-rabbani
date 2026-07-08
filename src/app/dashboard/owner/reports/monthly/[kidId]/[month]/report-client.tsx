'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Loading03Icon } from '@hugeicons/core-free-icons';
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

import type { IMonthlyStats } from '@/lib/actions/monthly-report';
import {
  generateMonthlyReport,
  markMonthlyReportFinal,
  unlockObservationsForReport,
  updateMonthlyReportNarrative,
} from '@/lib/actions/monthly-report';

// ─────────────── Types ───────────────

interface IMonthlyReportData {
  id: string;
  kidId: string;
  month: string;
  statsJson: unknown;
  narrativeAiDraft: string | null;
  narrativeFinal: string | null;
  lockedObservationIds: unknown;
  status: 'draft' | 'final' | 'stale';
  kid?: { id: string; name: string } | null;
  term?: { id: string; name: string } | null;
  generatedAt?: Date | string;
}

interface IMonthlyReportClientProps {
  kidId: string;
  termId: string;
  month: string;
  kidName: string;
  initialReport: IMonthlyReportData | null;
  termName: string;
}

// ─────────────── Helpers ───────────────

function formatMonthLabel(value: string): string {
  const [yearStr, monthStr] = value.split('-').map(Number);
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${months[monthStr - 1] ?? ''} ${yearStr}`;
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
    case 'final':
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 hover:bg-green-100"
        >
          ✓ Final
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

// ─────────────── Component ───────────────

export function MonthlyReportClient({
  kidId,
  termId,
  month,
  kidName,
  initialReport,
  termName: _termName,
}: IMonthlyReportClientProps) {
  const router = useRouter();
  const [report, setReport] = useState<IMonthlyReportData | null>(
    initialReport
  );
  const [stats, setStats] = useState<IMonthlyStats | null>(
    initialReport?.statsJson as IMonthlyStats | null
  );
  const [narrative, setNarrative] = useState(
    initialReport?.narrativeFinal ?? initialReport?.narrativeAiDraft ?? ''
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showRegenPrompt, setShowRegenPrompt] = useState(false);

  // ────────────────── Generation ──────────────────

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    try {
      const result = await generateMonthlyReport(kidId, termId, month);

      if (!result.success) {
        toast.error(result.error);
        setIsGenerating(false);
        return;
      }

      const data = result.data;
      setStats(data.stats);
      setNarrative(data.narrativeAiDraft || '');
      setReport({
        id: data.reportId,
        kidId,
        month,
        statsJson: data.stats,
        narrativeAiDraft: data.narrativeAiDraft || null,
        narrativeFinal: null,
        lockedObservationIds: null,
        status: data.status,
        generatedAt: new Date(),
      });

      toast.success('Laporan bulanan berhasil dibuat');
      router.refresh();
    } catch {
      toast.error('Gagal membuat laporan bulanan');
    } finally {
      setIsGenerating(false);
    }
  }, [kidId, termId, month, router]);

  // ────────────────── Edit Narrative ──────────────────

  const handleSaveNarrative = useCallback(async () => {
    if (!report) return;

    setIsSaving(true);
    try {
      const result = await updateMonthlyReportNarrative(report.id, narrative);

      if (result.success) {
        toast.success('Narasi berhasil disimpan');

        setReport((prev) =>
          prev
            ? {
                ...prev,
                narrativeFinal: narrative,
                status: result.data.status as 'draft' | 'final' | 'stale',
              }
            : null
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
  }, [report, narrative, router]);

  // ────────────────── Mark Final ──────────────────

  const handleMarkFinal = useCallback(async () => {
    if (!report) return;

    try {
      const result = await markMonthlyReportFinal(report.id);

      if (result.success) {
        toast.success('Laporan difinalisasi');
        setReport((prev) =>
          prev ? { ...prev, status: 'final' as const } : null
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Gagal memfinalisasi laporan');
    }
  }, [report, router]);

  // ────────────────── Override (Unlock) ──────────────────

  const handleUnlock = useCallback(async () => {
    if (!report) return;

    try {
      const result = await unlockObservationsForReport(report.id);

      if (result.success) {
        toast.success('Observasi berhasil dibuka kuncinya');
        setReport((prev) =>
          prev ? { ...prev, status: 'stale' as const } : null
        );
        setShowOverrideDialog(false);
        setShowRegenPrompt(true);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Gagal membuka kunci observasi');
      setShowOverrideDialog(false);
    }
  }, [report, router]);

  // ────────────────── Re-generate after stale ──────────────────

  const handleReGenerate = useCallback(async () => {
    setShowRegenPrompt(false);
    await handleGenerate();
  }, [handleGenerate]);

  // ────────────────── Render ──────────────────

  return (
    <div className="space-y-6">
      {/* Generate Button (shown when no report or stale) */}
      {(!report || report.status === 'stale') && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4">
          <div>
            <p className="text-sm font-medium text-zinc-700">
              {!report
                ? 'Generate laporan bulanan untuk melihat ringkasan statistik dan narasi AI'
                : 'Laporan ini perlu diperbarui — generate ulang untuk membuat laporan baru'}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {kidName} — {formatMonthLabel(month)}
            </p>
          </div>
          <Button
            onClick={
              report?.status === 'stale' ? handleReGenerate : handleGenerate
            }
            disabled={isGenerating}
            className="min-w-[160px]"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className="h-4 w-4 animate-spin"
                />
                Membuat Laporan...
              </span>
            ) : report?.status === 'stale' ? (
              'Generate Ulang'
            ) : (
              'Generate Laporan'
            )}
          </Button>
        </div>
      )}

      {/* Report content */}
      {report && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
          {/* Status */}
          <div className="mb-4 flex items-center gap-2">
            {getStatusBadge(report.status)}
          </div>

          {/* Stats Section */}
          {stats && (
            <div className="mb-6 space-y-4 rounded-lg bg-zinc-50 p-4">
              <h3 className="text-sm font-medium text-zinc-700">
                Ringkasan Statistik
              </h3>

              {/* Attendance */}
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <p className="text-xs text-zinc-500">Kehadiran</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {stats.attendancePercent}%
                </p>
                <p className="text-xs text-zinc-500">
                  {stats.daysPresent} dari {stats.totalSchoolDays} hari sekolah
                </p>
              </div>

              {/* Mood Distribution */}
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  Distribusi Suasana Hati
                </p>
                <div className="space-y-1">
                  {Object.entries(stats.moodDistribution)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([level, count]) => (
                      <div
                        key={level}
                        className="flex items-center justify-between rounded bg-white px-3 py-1.5 text-sm"
                      >
                        <span>{getMoodLabel(Number(level))}</span>
                        <span className="font-medium text-zinc-700">
                          {count}x
                        </span>
                      </div>
                    ))}
                  {Object.keys(stats.moodDistribution).length === 0 && (
                    <p className="text-sm italic text-zinc-400">
                      Tidak ada data
                    </p>
                  )}
                </div>
              </div>

              {/* Appetite Distribution */}
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  Distribusi Nafsu Makan
                </p>
                <div className="space-y-1">
                  {Object.entries(stats.appetiteDistribution).map(
                    ([appetite, count]) => (
                      <div
                        key={appetite}
                        className="flex items-center justify-between rounded bg-white px-3 py-1.5 text-sm"
                      >
                        <span>{translateAppetite(appetite)}</span>
                        <span className="font-medium text-zinc-700">
                          {count}x
                        </span>
                      </div>
                    )
                  )}
                  {Object.keys(stats.appetiteDistribution).length === 0 && (
                    <p className="text-sm italic text-zinc-400">
                      Tidak ada data
                    </p>
                  )}
                </div>
              </div>

              {/* Activity Participation */}
              <div>
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  Partisipasi Aktivitas
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.activityParticipation).map(
                    ([activity, count]) => (
                      <Badge
                        key={activity}
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                      >
                        {activity}: {count}x
                      </Badge>
                    )
                  )}
                  {Object.keys(stats.activityParticipation).length === 0 && (
                    <p className="text-sm italic text-zinc-400">
                      Tidak ada data partisipasi
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Editable Narrative */}
          <div className="mb-4 space-y-2">
            <label
              htmlFor="monthly-narrative"
              className="text-sm font-medium text-zinc-700"
            >
              Narasi Bulanan (dapat diedit)
            </label>
            <Textarea
              id="monthly-narrative"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={8}
              placeholder={
                !narrative
                  ? 'Narasi tidak tersedia — tulis manual atau generate ulang...'
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
                  narrative ===
                    (report.narrativeFinal ?? report.narrativeAiDraft ?? '')
                }
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Narasi'}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
            {report.status === 'draft' && (
              <Button
                variant="default"
                size="sm"
                onClick={handleMarkFinal}
                className="bg-green-600 hover:bg-green-700"
              >
                ✓ Finalisasi Laporan
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverrideDialog(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🔓 Buka Kunci Observasi
            </Button>
          </div>
        </div>
      )}

      {/* Empty state when no report and no data */}
      {!report && !isGenerating && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
          <p className="text-zinc-500">
            Klik &ldquo;Generate Laporan&rdquo; untuk membuat laporan bulanan{' '}
            {kidName}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Pastikan data observasi dan laporan harian sudah tersedia untuk
            bulan {formatMonthLabel(month)}
          </p>
        </div>
      )}

      {/* Override Confirmation Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Kunci Observasi</DialogTitle>
            <DialogDescription>
              Tindakan ini akan membuka kunci observasi yang terkunci dan
              menandai laporan sebagai &ldquo;perlu diperbarui.&rdquo; Setelah
              itu, Anda perlu generate ulang laporan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOverrideDialog(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleUnlock}>
              Ya, Buka Kunci
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-generation Prompt Dialog */}
      <Dialog open={showRegenPrompt} onOpenChange={setShowRegenPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Laporan Perlu Diperbarui</DialogTitle>
            <DialogDescription>
              Observasi sudah dibuka kuncinya. Silakan generate ulang laporan
              untuk membuat snapshot baru dengan data terbaru.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRegenPrompt(false);
                router.refresh();
              }}
            >
              Nanti
            </Button>
            <Button variant="default" onClick={handleReGenerate}>
              Generate Ulang Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
