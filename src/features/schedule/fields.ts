import { scheduleItemTypeEnum } from '@/db/schema';
import { FormField } from '@/types/field';

import { getCategoryOptions } from '@/lib/activity-utils';

import { SessionType } from '../sessionType/types';

interface ScheduleActivityFieldsArgs {
  isMultipleDays: boolean;
  sessions: SessionType[];
}

export const scheduledActivityFields = ({
  isMultipleDays = false,
  sessions,
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
      name: 'type',
      label: 'Tipe Kegiatan',
      type: 'select',
      selectOptions: scheduleItemTypeEnum.enumValues.map((v) => ({
        value: v,
        label: v === 'activity' ? 'Aktivitas' : 'Outing',
      })),
      required: true,
    },
    {
      name: 'category',
      label: 'Kategori Kegiatan',
      type: 'select',
      selectOptions: getCategoryOptions(),
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
