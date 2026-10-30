'use client';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '@/features/daily-class-report/constants';
import { TermData } from '@/features/term/types';
import {
  ChevronDown,
  SquareChevronLeftIcon,
  SquareChevronRightIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import TermSelector from '@/components/features/term/term-selector';
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

import { MonthlyAcademicDetails, MonthlyKidReportDetail } from '../types';

interface KidReportClientProps {
  currentKidId: string;
  currentTermId: string;
  terms: TermData[];
  kidDetails: MonthlyKidReportDetail;
  academicDetails: MonthlyAcademicDetails;
}

export default function KidReportClient({
  currentKidId,
  currentTermId,
  terms,
  kidDetails,
  academicDetails,
}: KidReportClientProps) {
  const totalAttendance = kidDetails?.dcrObservations.filter(
    (obs) => obs.attendance === 'present'
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
        <TermSelector terms={[]} showLabel={false} />
      </div>
      {/* Month Selector */}
      <div className="my-2 flex items-center justify-between border-2 rounded-xl">
        <Button
          render={<HugeiconsIcon icon={SquareChevronLeftIcon} size={100} />}
          className="w-fit"
        />
        <span>Oktober 2026</span>
        <Button
          render={<HugeiconsIcon icon={SquareChevronRightIcon} size={100} />}
          className="w-fit"
        />
      </div>
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
                  {obs.attendance === 'present' ? (
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
            <div className="flex items-baseline gap-2 py-2">
              <div className="min-w-25">
                <Badge>Selasa, 13 Okt</Badge>
              </div>
              <Separator orientation="vertical" className="" />
              <div>
                <p>Hadir-Mood-Makan</p>
                <p>Catatan</p>
                <p>Partipasi aktif</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        {/* Generation  */}
        <div className="my-2 p-4 border-2 rounded-md ">
          <Textarea></Textarea>
        </div>
      </div>
    </div>
  );
}
