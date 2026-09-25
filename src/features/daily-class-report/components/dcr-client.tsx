'use client';
import { ClassSession } from '@/features/class-session/types';
import { LeanKid } from '@/features/kid/types';
import { Theme } from '@/features/theme/types';

import ContentTabs, {
  ContentTabsProps,
} from '@/components/shared/content-tabs';

import DailyClassReportForm from './form';
import DCRObservation from './observation';

export default function DailyClassReportClient({
  classSessions,
  themes,
  kids,
  defaultClassSessionId,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  kids: LeanKid[];
  defaultClassSessionId?: string;
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
          <DCRObservation kids={kids} />
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
