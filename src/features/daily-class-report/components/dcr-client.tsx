'use client';
import { useState } from 'react';

import { ClassSession } from '@/features/class-session/types';
import { LeanKid } from '@/features/kid/types';
import { Theme } from '@/features/theme/types';
import { ActionResult } from '@/types';
import { getLocalDateString } from '@/utils/date-local';
import {
  Audit01Icon,
  FilePenIcon,
  HistoryIcon,
  Warning,
} from '@hugeicons/core-free-icons';

import ContentTabs, {
  ContentTabsProps,
} from '@/components/shared/content-tabs';
import { EmptyState } from '@/components/shared/empty-state';

import {
  DailyClassReportItem,
  DailyClassReportList,
  DailyKidReportItem,
  ReportTemplate,
} from '../types';
import { DailyClassReportForm } from './form';
import DCRHistory from './history';
import DCRKidObservation from './observation';
import DailyReport from './report';

function DateInformation() {
  const formattedTodayDate = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return (
    <h2 className="w-full text-center font-semibold my-2 text-primary">
      {formattedTodayDate}
    </h2>
  );
}

export default function DailyClassReportClient({
  classSessions,
  themes,
  availableKids,
  defaultClassSessionId,
  existingDCRsResults,
  defaultReportTemplate,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  availableKids: LeanKid[];
  defaultClassSessionId?: string;
  existingDCRsResults: ActionResult<DailyClassReportList>;
  defaultReportTemplate: ReportTemplate['content'];
}) {
  const currentDate = getLocalDateString();
  const [currentDcr, setCurrentDcr] = useState<
    DailyClassReportItem | undefined
  >(existingDCRsResults.data?.find((dcr) => dcr.date === currentDate));
  const existingObservations = currentDcr?.observations;
  const unfilledKids = availableKids.filter(
    (kid) => !existingObservations?.some((obs) => obs.kidId === kid.id)
  );

  const handleSaveNarrativeSuccess = ({
    dcrObservationId,
    dailyKidReport,
  }: {
    dcrObservationId: string;
    dailyKidReport: DailyKidReportItem | null;
  }) => {
    setCurrentDcr((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        observations: prev.observations.map((obs) =>
          obs.id === dcrObservationId
            ? { ...obs, kidReport: dailyKidReport }
            : obs
        ),
      };
    });
  };

  const tabs: ContentTabsProps['tabs'] = [
    {
      triggerValue: 'input',
      triggerLabel: 'Input',
      icon: FilePenIcon,
      children: (
        <div>
          <DateInformation />
          <DailyClassReportForm
            classSessions={classSessions}
            themes={themes}
            defaultClassSessionId={defaultClassSessionId}
            existingDCR={currentDcr}
          />
          {defaultClassSessionId ? (
            <DCRKidObservation
              unfilledKids={unfilledKids}
              existingObservations={existingObservations ?? []}
            />
          ) : (
            <EmptyState
              title="Pilih sesi kelas terlebih dahulu."
              icon={Warning}
            />
          )}
        </div>
      ),
      maxWidthPx: '900px',
    },
    {
      triggerValue: 'report',
      triggerLabel: 'Laporan',
      icon: Audit01Icon,
      children: (
        <div>
          <DateInformation />
          {currentDcr ? (
            <DailyReport
              existingDCR={currentDcr}
              unfilledKids={unfilledKids}
              availableKids={availableKids}
              defaultReportTemplate={defaultReportTemplate}
              onSaveNarrativeSuccess={handleSaveNarrativeSuccess}
            />
          ) : (
            <EmptyState title="Belum ada data observasi kelas dan anak-anak" />
          )}
        </div>
      ),
      maxWidthPx: '900px',
    },
    {
      triggerValue: 'history',
      triggerLabel: 'Riwayat',
      icon: HistoryIcon,
      children: <DCRHistory defaultDcrs={existingDCRsResults.data ?? []} />,
      maxWidthPx: '900px',
    },
  ];

  return (
    <div className="py-2 px-2">
      {/* <div>{JSON.stringify(currentDcr?.observations)}</div> */}
      <ContentTabs tabs={tabs} fullWidth />
    </div>
  );
}
