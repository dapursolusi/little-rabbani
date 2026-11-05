'use client';
import { useState } from 'react';

import { ClassSession } from '@/features/class-session/types';
import { LeanKid } from '@/features/kid/types';
import { ThemeWithSubThemes } from '@/features/theme/types';
import { getLocalDateString } from '@/utils/date';
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
  DailyClassReport,
  DailyKidReport,
  DcrObservation,
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
  enrolledKids,
  defaultClassSessionId,
  existingDCRs,
  defaultReportTemplate,
}: {
  classSessions: ClassSession[];
  themes: ThemeWithSubThemes[];
  enrolledKids: LeanKid[];
  defaultClassSessionId?: string;
  existingDCRs: DailyClassReport[];
  defaultReportTemplate: ReportTemplate['content'];
}) {
  const currentDate = getLocalDateString();
  const [currentDcr, setCurrentDcr] = useState<DailyClassReport | undefined>(
    existingDCRs.find((dcr) => dcr.date === currentDate)
  );
  const existingObservations = currentDcr?.observations;
  const unfilledKids = enrolledKids.filter(
    (kid) => !existingObservations?.some((obs) => obs.kidId === kid.id)
  );

  const handleSaveNarrativeSuccess = ({
    dcrObservationId,
    dailyKidReport,
  }: {
    dcrObservationId: string;
    dailyKidReport: DailyKidReport | null;
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

  const handleMarkSentReportSuccess = ({
    dcrObservationId,
    dailyKidReport,
  }: {
    dcrObservationId: string;
    dailyKidReport: DailyKidReport | null;
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

  const handleObservationFormSuccess = (result: DcrObservation) => {
    setCurrentDcr((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        observations: [...prev.observations, result],
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
              onObservationFormSuccess={handleObservationFormSuccess}
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
              enrolledKids={enrolledKids}
              defaultReportTemplate={defaultReportTemplate}
              onSaveNarrativeSuccess={handleSaveNarrativeSuccess}
              onMarkSentReportSuccess={handleMarkSentReportSuccess}
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
      children: <DCRHistory defaultDcrs={existingDCRs} />,
      maxWidthPx: '900px',
    },
  ];

  return (
    <div className="py-2 px-2">
      <ContentTabs tabs={tabs} fullWidth />
    </div>
  );
}
