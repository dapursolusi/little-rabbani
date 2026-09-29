'use client';
import { ClassSession } from '@/features/class-session/types';
import { LeanKid } from '@/features/kid/types';
import { Theme } from '@/features/theme/types';
import { ActionResult } from '@/types';
import { Warning } from '@hugeicons/core-free-icons';

import ContentTabs, {
  ContentTabsProps,
} from '@/components/shared/content-tabs';
import { EmptyState } from '@/components/shared/empty-state';

import { DCRObservation, DailyClassReport } from '../types';
import { DailyClassReportForm } from './form';
import DCRHistory from './history';
import DCRKidObservation from './observation';

export default function DailyClassReportClient({
  classSessions,
  themes,
  availableKids,
  defaultClassSessionId,
  existingDCRsResults,
  existingObservationsResults,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  availableKids: LeanKid[];
  defaultClassSessionId?: string;
  existingDCRsResults: ActionResult<DailyClassReport[]>;
  existingObservationsResults: ActionResult<DCRObservation[]>;
}) {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentDCR = existingDCRsResults.data?.find(
    (dcr) => dcr.date === currentDate
  );
  const tabs: ContentTabsProps['tabs'] = [
    {
      triggerValue: 'input',
      triggerLabel: 'Input',
      children: (
        <div>
          <DailyClassReportForm
            classSessions={classSessions}
            themes={themes}
            defaultClassSessionId={defaultClassSessionId}
            existingDCR={currentDCR as DailyClassReport}
          />
          {defaultClassSessionId ? (
            <DCRKidObservation
              availableKids={availableKids}
              existingObservationsResults={existingObservationsResults}
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
      triggerValue: 'history',
      triggerLabel: 'Riwayat',
      children: <DCRHistory defaultDcrs={existingDCRsResults.data ?? []} />,
    },
  ];
  const formattedTodayDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return (
    <div className="py-2 px-2">
      <h2 className="w-full text-center font-semibold my-2 text-primary">
        {formattedTodayDate}
      </h2>
      <ContentTabs tabs={tabs} fullWidth />
    </div>
  );
}
