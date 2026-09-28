'use client';
import { ClassSession } from '@/features/class-session/types';
import { LeanKid } from '@/features/kid/types';
import { Theme } from '@/features/theme/types';
import { ActionResult } from '@/types';
import { DatabaseIcon, Warning } from '@hugeicons/core-free-icons';

import ContentTabs, {
  ContentTabsProps,
} from '@/components/shared/content-tabs';
import { EmptyState } from '@/components/shared/empty-state';

import { DCRObservation } from '../types';
import DailyClassReportForm from './form';
import DCRKidObservation from './observation';

export default function DailyClassReportClient({
  classSessions,
  themes,
  availableKids,
  defaultClassSessionId,
  existingObservationsResults,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  availableKids: LeanKid[];
  defaultClassSessionId?: string;
  existingObservationsResults: ActionResult<DCRObservation[]>;
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
