'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '@/features/daily-class-report/constants';
import { Term } from '@/features/term/types';
import { formatDate } from '@/utils/date';
import { pushParam } from '@/utils/search-params';
import {
  AiBrain01Icon,
  ChevronDown,
  SquareChevronLeftIcon,
  SquareChevronRightIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

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

import { generateMonthlyReport } from '../actions';
import {
  MonthlyAcademicDetails,
  MonthlyKidReportDetail,
  MonthlyReportOutput,
} from '../types';

function formatDraft(draft: MonthlyReportOutput): string {
  return [
    draft.socialEmotional,
    '',
    draft.wellbeing,
    '',
    'Sorotan:',
    ...draft.highlights.map((h) => `- ${h}`),
    '',
    'Rekomendasi di rumah:',
    ...draft.homeRecommendations.map((r) => `- ${r}`),
  ].join('\n');
}

interface KidReportClientProps {
  currentKidId: string;
  currentTermId: string;
  currentMonth: string;
  terms: Term[];
  kidDetails: MonthlyKidReportDetail;
  academicDetails: MonthlyAcademicDetails;
}

function MonthPicker({ currentMonth }: { currentMonth: string }) {
  const router = useRouter();
  const handleChangeMonth = (offset: number) => {
    const [year, monthNumber] = currentMonth.split('-').map(Number);

    const date = new Date(year, monthNumber - 1 + offset, 1);

    const changedMonth = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
    ].join('-');

    pushParam({ key: 'month', value: changedMonth, router });
  };
  return (
    <div className="my-2 flex items-center justify-between border-2 rounded-xl">
      <Button
        render={<HugeiconsIcon icon={SquareChevronLeftIcon} size={100} />}
        className="w-fit"
        onClick={() => handleChangeMonth(-1)}
      />
      <span>{formatDate(currentMonth)}</span>
      <Button
        render={<HugeiconsIcon icon={SquareChevronRightIcon} size={100} />}
        className="w-fit"
        onClick={() => handleChangeMonth(1)}
      />
    </div>
  );
}

export default function KidReportClient({
  currentKidId,
  currentTermId,
  currentMonth,
  kidDetails,
  academicDetails,
}: KidReportClientProps) {
  const [aiDraft, setAiDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const result = await generateMonthlyReport({
        kidId: currentKidId,
        termId: currentTermId,
        yearMonth: currentMonth,
      });
      if (result?.success) {
        setAiDraft(formatDraft(result.data));
        toast.success(result.message ?? 'Draft laporan berhasil dibuat');
      } else {
        toast.error(result?.message ?? 'Gagal membuat draft');
      }
    } catch {
      toast.error('Terjadi kesalahan. Silahkan coba lagi');
    } finally {
      setIsGenerating(false);
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
        <TermSelector terms={[]} showLabel={false} />
      </div>
      {/* Month Selector */}
      <MonthPicker currentMonth={currentMonth} />
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
          <Textarea
            value={aiDraft}
            onChange={(e) => setAiDraft(e.target.value)}
          />
          <Button
            className="mt-2 w-fit"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <HugeiconsIcon icon={AiBrain01Icon} />
            {isGenerating ? 'Membuat draft...' : 'Buat Draft dengan AI'}
          </Button>
        </div>
      </div>
    </div>
  );
}
