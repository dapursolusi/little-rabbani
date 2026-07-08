'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type {
  IQuarterlySections,
  IQuarterlyStats,
} from '@/lib/actions/quarterly-report';
import {
  generateQuarterlyReport,
  markQuarterlyReportFinal,
  updateQuarterlySections,
} from '@/lib/actions/quarterly-report';

// ─────────────── Types ───────────────

interface IQuarterlyReportData {
  id: string;
  kidId: string;
  termId: string;
  statsJson: unknown;
  sectionsJson: unknown;
  narrativeAiDraft: string | null;
  narrativeFinal: string | null;
  pdfData: string | null;
  previousSnapshotId: string | null;
  status: 'draft' | 'final' | 'stale';
  kid?: { id: string; name: string } | null;
  term?: { id: string; name: string } | null;
  generatedAt?: Date | string;
}

interface IQuarterlyReportClientProps {
  kidId: string;
  termId: string;
  kidName: string;
  termName: string;
  termStartDate: string;
  termEndDate: string;
  initialReport: IQuarterlyReportData | null;
}

// ─────────────── Helpers ───────────────

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
    1: 'Sangat Tidak Baik',
    2: 'Kurang Baik',
    3: 'Biasa Saja',
    4: 'Baik',
    5: 'Sangat Baik',
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

export function QuarterlyReportClient({
  kidId,
  termId,
  kidName,
  termName,
  termStartDate: _termStartDate,
  termEndDate: _termEndDate,
  initialReport,
}: IQuarterlyReportClientProps) {
  const router = useRouter();
  const [report, setReport] = useState<IQuarterlyReportData | null>(
    initialReport
  );
  const [stats, setStats] = useState<IQuarterlyStats | null>(
    initialReport?.statsJson as IQuarterlyStats | null
  );

  const initialSections =
    (initialReport?.sectionsJson as IQuarterlySections | null) ?? {
      changes: '',
      improvements: '',
      recommendations: '',
    };

  const [sections, setSections] = useState<IQuarterlySections>(initialSections);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfFallback, setPdfFallback] = useState<{
    message: string;
    data: {
      kidName: string;
      termName: string;
      termPeriod: string;
      sections: IQuarterlySections;
      stats: unknown;
    };
  } | null>(null);

  // ────────────────── Generation ──────────────────

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setPdfFallback(null);

    try {
      const result = await generateQuarterlyReport(kidId, termId);

      if (!result.success) {
        toast.error(result.error);
        setIsGenerating(false);
        return;
      }

      const data = result.data;
      setStats(data.stats);
      setSections(data.sections);
      setReport({
        id: data.reportId,
        kidId,
        termId,
        statsJson: data.stats,
        sectionsJson: data.sections,
        narrativeAiDraft: data.narrativeAiDraft || null,
        narrativeFinal: null,
        pdfData: null,
        previousSnapshotId: data.previousSnapshotId,
        status: data.status,
        generatedAt: new Date(),
      });

      if (
        !data.sections.changes &&
        !data.sections.improvements &&
        !data.sections.recommendations
      ) {
        toast(
          'Laporan berhasil dibuat. Bagian narasi dapat diedit secara manual karena AI tidak tersedia.'
        );
      } else {
        toast.success('Laporan trivulanan berhasil dibuat');
      }

      router.refresh();
    } catch {
      toast.error('Gagal membuat laporan trivulanan');
    } finally {
      setIsGenerating(false);
    }
  }, [kidId, termId, router]);

  // ────────────────── Section Editing ──────────────────

  const handleSaveSections = useCallback(async () => {
    if (!report) return;

    setIsSaving(true);
    try {
      const result = await updateQuarterlySections(report.id, sections);

      if (result.success) {
        toast.success('Bagian laporan berhasil disimpan');
        setReport((prev) =>
          prev
            ? {
                ...prev,
                narrativeFinal: Object.values(sections)
                  .filter(Boolean)
                  .join('\n\n'),
                status: result.data.status as 'draft' | 'final' | 'stale',
              }
            : null
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Gagal menyimpan bagian laporan');
    } finally {
      setIsSaving(false);
    }
  }, [report, sections, router]);

  // ────────────────── Mark Final ──────────────────

  const handleMarkFinal = useCallback(async () => {
    if (!report) return;

    try {
      const result = await markQuarterlyReportFinal(report.id);

      if (result.success) {
        toast.success('Laporan trivulanan difinalisasi');
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

  // ────────────────── Download PDF ──────────────────

  const handleDownloadPdf = useCallback(async () => {
    if (!report) return;

    setIsDownloading(true);
    setPdfFallback(null);

    try {
      const response = await fetch(
        `/api/reports/quarterly/${kidId}?termId=${termId}`
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        toast.error(errorBody?.error ?? 'Gagal mengunduh PDF');
        setIsDownloading(false);
        return;
      }

      const contentType = response.headers.get('Content-Type');

      // Check if it's a PDF response
      if (contentType === 'application/pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-trivulan-${kidName.toLowerCase().replace(/\s+/g, '-')}-${termName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDF berhasil diunduh');
      } else {
        // VAL-QUARTERLY-009: react-pdf fallback — HTML view
        const data = await response.json();
        if (data.fallback) {
          setPdfFallback(data);
          toast.warning(
            'PDF gagal dibuat. Laporan dapat dilihat dalam tampilan HTML.'
          );
        }
      }
    } catch {
      toast.error('Gagal mengunduh PDF. Periksa koneksi Anda.');
    } finally {
      setIsDownloading(false);
    }
  }, [report, kidId, termId, kidName, termName]);

  // ────────────────── Render ──────────────────

  return (
    <div className="space-y-6">
      {/* Generate Button (shown when no report or stale) */}
      {(!report || report.status === 'stale') && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4">
          <div>
            <p className="text-sm font-medium text-zinc-700">
              {!report
                ? 'Generate laporan trivulanan untuk melihat ringkasan statistik dan narasi AI'
                : 'Laporan ini perlu diperbarui — generate ulang untuk membuat laporan baru'}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {kidName} — {termName}
            </p>
          </div>
          <Button
            onClick={handleGenerate}
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
          {/* Status + Download */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusBadge(report.status)}
              {report.previousSnapshotId && (
                <span className="text-xs text-zinc-400">
                  Term sebelumnya digunakan sebagai perbandingan
                </span>
              )}
            </div>

            {report.status !== 'stale' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="h-3 w-3 animate-spin"
                    />
                    Mengunduh...
                  </span>
                ) : (
                  '⬇ Download PDF'
                )}
              </Button>
            )}
          </div>

          {/* Stats Section */}
          {stats && (
            <div className="mb-6 space-y-4 rounded-lg bg-zinc-50 p-4">
              <h3 className="text-sm font-medium text-zinc-700">
                Ringkasan Statistik Trivulan
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
                  Partisipasi Aktivitas Teratas
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.activityParticipation)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([activity, count]) => (
                      <Badge
                        key={activity}
                        variant="secondary"
                        className="bg-blue-100 text-blue-700"
                      >
                        {activity}: {count}x
                      </Badge>
                    ))}
                  {Object.keys(stats.activityParticipation).length === 0 && (
                    <p className="text-sm italic text-zinc-400">
                      Tidak ada data partisipasi
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Editable Sections: Perubahan */}
          <div className="mb-4 space-y-2">
            <label
              htmlFor="section-changes"
              className="text-sm font-medium text-zinc-700"
            >
              1. Perubahan
            </label>
            <Textarea
              id="section-changes"
              value={sections.changes}
              onChange={(e) =>
                setSections((prev) => ({ ...prev, changes: e.target.value }))
              }
              rows={5}
              placeholder={
                !sections.changes
                  ? 'Bagian ini tidak dapat dihasilkan — tulis manual...'
                  : 'Edit bagian Perubahan...'
              }
              className="w-full"
            />
          </div>

          {/* Editable Sections: Peningkatan */}
          <div className="mb-4 space-y-2">
            <label
              htmlFor="section-improvements"
              className="text-sm font-medium text-zinc-700"
            >
              2. Peningkatan
            </label>
            <Textarea
              id="section-improvements"
              value={sections.improvements}
              onChange={(e) =>
                setSections((prev) => ({
                  ...prev,
                  improvements: e.target.value,
                }))
              }
              rows={5}
              placeholder={
                !sections.improvements
                  ? 'Bagian ini tidak dapat dihasilkan — tulis manual...'
                  : 'Edit bagian Peningkatan...'
              }
              className="w-full"
            />
          </div>

          {/* Editable Sections: Rekomendasi */}
          <div className="mb-4 space-y-2">
            <label
              htmlFor="section-recommendations"
              className="text-sm font-medium text-zinc-700"
            >
              3. Rekomendasi
            </label>
            <Textarea
              id="section-recommendations"
              value={sections.recommendations}
              onChange={(e) =>
                setSections((prev) => ({
                  ...prev,
                  recommendations: e.target.value,
                }))
              }
              rows={5}
              placeholder={
                !sections.recommendations
                  ? 'Bagian ini tidak dapat dihasilkan — tulis manual...'
                  : 'Edit bagian Rekomendasi...'
              }
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveSections}
              disabled={isSaving}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Bagian'}
            </Button>

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
          </div>
        </div>
      )}

      {/* Empty state when no report */}
      {!report && !isGenerating && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
          <p className="text-zinc-500">
            Klik &ldquo;Generate Laporan&rdquo; untuk membuat laporan trivulanan{' '}
            {kidName}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Pastikan data observasi dan laporan harian sudah tersedia untuk term{' '}
            {termName}
          </p>
        </div>
      )}

      {/* PDF Fallback View */}
      {pdfFallback && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-amber-600 text-sm font-medium">
              ⚠️ Tampilan HTML (PDF gagal dibuat)
            </span>
          </div>
          <div className="space-y-4 rounded-lg bg-white p-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                {pdfFallback.data.kidName}
              </h3>
              <p className="text-xs text-zinc-500">
                {pdfFallback.data.termName} — {pdfFallback.data.termPeriod}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-700">
                1. Perubahan
              </h4>
              <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                {pdfFallback.data.sections.changes ||
                  'Bagian ini tidak dapat dihasilkan.'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-700">
                2. Peningkatan
              </h4>
              <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                {pdfFallback.data.sections.improvements ||
                  'Bagian ini tidak dapat dihasilkan.'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-700">
                3. Rekomendasi
              </h4>
              <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">
                {pdfFallback.data.sections.recommendations ||
                  'Bagian ini tidak dapat dihasilkan.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
