import type { FormField } from '@/types/field';

export const holidayFields = (): FormField[] => [
  {
    name: 'reason',
    label: 'Alasan Libur',
    type: 'text',
    required: true,
  },
  {
    name: 'startDate',
    label: 'Tanggal Mulai',
    type: 'date',
    required: true,
  },
  {
    name: 'endDate',
    label: 'Tanggal Selesai',
    type: 'date',
    required: true,
  },
  {
    name: 'scope',
    label: 'Cakupan',
    type: 'select',
    selectOptions: [
      { label: 'Nasional', value: 'national' },
      { label: 'Kustom', value: 'custom' },
      { label: 'Term', value: 'term' },
    ],
    required: true,
  },
];
