import { FormField } from '@/types/field';

import { SessionType } from '../sessionType/types';
import { SubTheme } from '../theme/types';

interface CalendarEventFieldsArgs {
  isMultipleDays: boolean;
  sessions: SessionType[];
  subThemes: SubTheme[];
  indoor: boolean;
}

export const calendarEventFields = ({
  isMultipleDays = false,
  sessions,
  subThemes,
  indoor = false,
}: CalendarEventFieldsArgs): FormField[] => {
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
      selectOptions: Object.values(
        subThemes.reduce<
          Record<
            string,
            { group: string; options: { value: string; label: string }[] }
          >
        >((acc, st) => {
          const themeName = st.theme?.name ?? 'Tanpa Tema';
          (acc[themeName] ??= { group: themeName, options: [] }).options.push({
            value: st.id,
            label: st.name,
          });
          return acc;
        }, {})
      ),
      required: true,
    },
    {
      name: 'indoor',
      label: `Kegiatan ${indoor ? 'Indoor / Dalam Kelas' : 'Outdoor / Luar Kelas'}`,
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
