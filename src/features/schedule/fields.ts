import { FormField } from '@/types/field';

import { SessionType } from '../sessionType/types';
import { SubTheme } from '../theme/types';

interface ScheduleActivityFieldsArgs {
  isMultipleDays: boolean;
  sessions: SessionType[];
  subThemes: SubTheme[];
}

export const scheduledActivityFields = ({
  isMultipleDays = false,
  sessions,
  subThemes,
}: ScheduleActivityFieldsArgs): FormField[] => {
  return [
    {
      name: 'name',
      label: 'Nama Kegiatan',
      type: 'text',
      required: true,
    },
    {
      name: 'isMultipleDays',
      label: 'Lebih Dari 1 Hari',
      type: 'switch',
      required: true,
    },
    ...(isMultipleDays
      ? [
          {
            name: 'startDate' as const,
            label: 'Tanggal Mulai' as const,
            type: 'date' as const,
            required: true,
          },
          {
            name: 'endDate' as const,
            label: 'Tanggal Selesai' as const,
            type: 'date' as const,
            required: true,
          },
        ]
      : [
          {
            name: 'startDate' as const,
            label: 'Tanggal Kegiatan' as const,
            type: 'date' as const,
            required: true,
          },
          {
            name: 'endDate' as const,
            label: '' as const,
            type: 'hidden' as const,
            required: false,
          },
        ]),
    {
      name: 'sessionTypeId',
      label: 'Jenis Sesi',
      type: 'select',
      selectOptions: sessions.map((session) => {
        return {
          value: session.id,
          label: session.name,
        };
      }),
      required: true,
    },
    {
      name: 'subThemeId',
      label: 'Sub Tema',
      type: 'select',
      selectOptions: subThemes.map((st) => ({
        value: st.id,
        label: st.name,
      })),
      required: true,
    },
    {
      name: 'indoor',
      label: 'Kegiatan Indoor',
      type: 'switch',
      required: true,
    },
    {
      name: 'location',
      label: 'Lokasi',
      type: 'text',
    },
    {
      name: 'itemsToBring',
      label: 'Barang Bawaan',
      type: 'text',
    },
    {
      name: 'permissionRequired',
      label: 'Permintaan Izin',
      type: 'checkbox',
    },
  ];
};
