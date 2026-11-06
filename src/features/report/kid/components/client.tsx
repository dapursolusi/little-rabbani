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
  MONTHLY_REPORT_STATUS_LABELS,
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
  SquareChevronLeftIcon,
  SquareChevronRightIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import TermSelectorBase from '@/components/features/term/term-selector';
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
  // What the DB holds right now — baseline for the dirty check.
  const [savedNarrative, setSavedNarrative] = useState(
    initialReport?.narrative ?? ''
  );
  const [narrative, setNarrative] = useState(initialReport?.narrative ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const isSent = reportStatus === MONTHLY_REPORT_STATUS.SENT;
  const isDirty = narrative !== savedNarrative;

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
    setIsGenerating(true);
    try {
      const result = await kidReportAction.generateMonthlyReport(params);
      if (result?.success) {
        // Server persisted the draft — adopt it locally only on success.
        setHasReport(true);
        setNarrative(result.data.narrative);
        setSavedNarrative(result.data.narrative);
        setReportStatus(MONTHLY_REPORT_STATUS.GENERATED);
        toast.success(result.message ?? 'Draft laporan berhasil dibuat');
        router.refresh();
      } else {
        toast.error(result?.message ?? 'Gagal membuat draft');
      }
    } catch {
      toast.error('Terjadi kesalahan. Silahkan coba lagi');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRegenerateClick() {
    // Protect unsaved manual edits before regeneration overwrites them.
    if (isDirty) {
      setShowRegenConfirm(true);
      return;
    }
    handleGenerate();
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await kidReportAction.saveMonthlyReportNarrative({
        ...params,
        narrative,
      });
      if (result?.success) {
        setSavedNarrative(result.data.narrative ?? '');
        setReportStatus(result.data.reportStatus);
        toast.success(result.message ?? 'Laporan berhasil disimpan');
        router.refresh();
      } else {
        toast.error(result?.message ?? 'Gagal menyimpan laporan');
      }
    } catch {
      toast.error('Terjadi kesalahan. Silahkan coba lagi');
    } finally {
      setIsSaving(false);
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
                <Badge>10</Badge>
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
            {reportStatus && (
              <div className="mb-2">
                <Badge>{MONTHLY_REPORT_STATUS_LABELS[reportStatus]}</Badge>
              </div>
            )}
            <Textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              readOnly={isSent}
              placeholder="Buat draft dengan AI, atau tulis manual di sini"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {!hasReport && (
                <Button onClick={handleRegenerateClick} disabled={isGenerating}>
                  <HugeiconsIcon icon={AiBrain01Icon} />
                  {isGenerating ? 'Membuat draft...' : 'Buat Draft dengan AI'}
                </Button>
              )}
              {hasReport && !isSent && (
                <>
                  <Button
                    onClick={handleRegenerateClick}
                    disabled={isGenerating}
                    variant="outline"
                  >
                    <HugeiconsIcon icon={AiBrain01Icon} />
                    {isGenerating ? 'Membuat draft...' : 'Regenerate'}
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving || !isDirty}>
                    <HugeiconsIcon icon={FloppyDiskIcon} />
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unsaved-changes guard before regeneration */}
      <AlertDialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ada perubahan yang belum disimpan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Regenerate akan mengganti isi laporan dengan draft AI baru dan
              perubahan manual Anda akan hilang. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>
              Ya, Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
