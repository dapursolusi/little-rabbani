'use client';
import { ClassSession } from '@/features/class-session/types';
import { LeanKid } from '@/features/kid/types';
import { Theme } from '@/features/theme/types';

import ContentTabs, {
  ContentTabsProps,
} from '@/components/shared/content-tabs';

import { DCRObservation } from '../types';
import DailyClassReportForm from './form';
import DCRKidObservation from './observation';

export default function DailyClassReportClient({
  classSessions,
  themes,
  kids,
  defaultClassSessionId,
  existingObservations,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  kids: LeanKid[];
  defaultClassSessionId?: string;
  existingObservations: DCRObservation[];
}) {
  const tabs: ContentTabsProps['tabs'] = [
    {
      triggerValue: 'input',
      triggerLabel: 'Input Laporan Harian & Observasi',
      children: (
        <div>
          <DailyClassReportForm
            classSessions={classSessions}
            themes={themes}
            defaultClassSessionId={defaultClassSessionId}
          />
          <DCRKidObservation
            kids={kids}
            existingObservations={existingObservations}
          />
        </div>
      ),
      maxWidthPx: '900px',
    },
    {
      triggerValue: 'history',
      triggerLabel: 'Riwayat Laporan',
      children: (
        <div>
          <h1>Riwayat Laporan Harian & Observasi</h1>
        </div>
      ),
    },
  ];
  return (
    <div>
      <ContentTabs tabs={tabs} fullWidth />
    </div>
  );
}
