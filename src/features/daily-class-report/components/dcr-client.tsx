'use client';
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

import { DCRObservation, DailyClassReport } from '../types';
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
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  availableKids: LeanKid[];
  defaultClassSessionId?: string;
  existingDCRsResults: ActionResult<DailyClassReport[]>;
}) {
  const currentDate = getLocalDateString();
  const currentDCR = existingDCRsResults.data?.find(
    (dcr) => dcr.date === currentDate
  );
  const existingObservations = existingDCRsResults.data?.find(
    (dcr) => dcr.date === currentDate
  )?.observations;
  const unfilledKids = availableKids.filter(
    (kid) => !existingObservations?.some((obs) => obs.kidId === kid.id)
  );
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
            existingDCR={currentDCR}
          />
          {defaultClassSessionId ? (
            <DCRKidObservation
              unfilledKids={unfilledKids}
              existingObservations={existingObservations as DCRObservation[]}
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
          <DailyReport
            existingObservations={existingObservations as DCRObservation[]}
            unfilledKids={unfilledKids}
            availableKids={availableKids}
          />
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
      <ContentTabs tabs={tabs} fullWidth />
    </div>
  );
}
