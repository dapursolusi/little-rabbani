'use client';

import { useRouter } from 'next/navigation';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '@/features/daily-class-report/constants';
import { Term } from '@/features/term/types';
import { ChevronDown, NoteEditIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import TermSelectorBase from '@/components/features/term/term-selector';
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

import { MonthlyAcademicDetails, MonthlyKidReportDetail } from '../types';
import { MonthPicker } from './month-picker';
import KidReportPanel, { MonthlyInitialReport } from './report-panel';

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
  // Final month of the selected term belongs to termly reporting. No termly
  // report module exists yet, so the flow is disabled rather than linked.
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
            {/* The termly module does not exist yet; the link would 404. */}
            <Button disabled>
              <HugeiconsIcon icon={NoteEditIcon} />
              Laporan triwulanan belum tersedia
            </Button>
          </div>
        ) : (
          <KidReportPanel
            currentKidId={currentKidId}
            currentTermId={currentTermId}
            currentMonth={currentMonth}
            initialReport={initialReport}
          />
        )}
      </div>
    </div>
  );
}
