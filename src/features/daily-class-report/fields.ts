'use client';
import { FormField, SelectOptionGroup } from '@/types/field';

import { ClassSession } from '../class-session/types';
import { Theme } from '../theme/types';

export const dailyClassReportFormFields = ({
  classSessions,
  themes,
  onValueChange,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  onValueChange: (value: string) => void;
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
    onValueChange,
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
    type: 'text',
    fullWidth: true,
  },
];
