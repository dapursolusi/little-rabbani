import type { FormField } from '@/types/field';

export const termFields = (): FormField[] => [
  {
    name: 'name',
    label: 'Nama Term',
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
];
