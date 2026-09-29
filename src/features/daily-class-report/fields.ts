'use client';
import { FormField, SelectOptionGroup } from '@/types/field';

import { ClassSession } from '../class-session/types';
import { Theme } from '../theme/types';
import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
  KidAttendance,
  KidMood,
} from './constants';

export const dailyClassReportFormFields = ({
  classSessions,
  themes,
  onValueChangeAction,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  onValueChangeAction: (value: string) => void;
}): FormField[] => [
  {
    name: 'classSessionId',
    label: 'Sesi',
    type: 'select',
    fullWidth: true,
    selectOptions: classSessions.map((cs) => ({
      value: cs.id,
      label: `${cs.name} (${cs.startTime} - ${cs.endTime})`,
    })),
    onValueChange: onValueChangeAction,
  },
  {
    name: 'subThemeId',
    label: 'Sub Tema',
    type: 'select',
    fullWidth: true,
    selectOptions: themes.map((t) => ({
      group: t.name,
      options: t.subThemes?.map((st) => ({
        value: st.id,
        label: st.name,
      })),
    })) as SelectOptionGroup[],
  },
  {
    name: 'description',
    label: 'Deskripsi',
    type: 'textarea',
    fullWidth: true,
  },
];

export const dcrObservationFormFieldsPresentAttendance = ({
  watch,
}: {
  watch: (name: string) => unknown;
}): FormField[] => {
  const isPresent =
    (watch('attendance') as unknown) ===
    ('present' as unknown as KidAttendance);
  if (!isPresent) {
    return [];
  }
  return [
    {
      name: 'mood',
      label: { text: 'Mood', className: 'text-primary' },
      type: 'toggle-group',
      fullWidth: true,
      items: Object.entries(KID_MOOD_LABELS).map(([key, value]) => ({
        value: key as KidMood,
        label: value as string,
      })),
    },
    {
      name: 'appetite',
      label: { text: 'Makan', className: 'text-primary' },
      type: 'toggle-group',
      fullWidth: true,
      items: Object.entries(KID_APPETITE_LABELS).map(([key, value]) => ({
        value: key,
        label: value as string,
      })),
    },
    {
      name: 'notes',
      label: { text: 'Catatan (Opsional)', className: 'text-primary' },
      type: 'textarea',
      fullWidth: true,
    },
  ];
};

export const dcrObservationFormFields = ({
  watch,
}: {
  watch: (name: string) => unknown;
}): FormField[] => [
  {
    name: 'attendance',
    label: { text: 'Kehadiran', className: 'text-primary' },
    type: 'toggle-group',
    fullWidth: true,
    items: Object.entries(KID_ATTENDANCE_LABELS).map(([key, value]) => ({
      value: key,
      label: value as string,
    })),
  },
  ...dcrObservationFormFieldsPresentAttendance({ watch }),
];
