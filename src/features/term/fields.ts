import { FormField } from '@/types/field';

export const termFormFields = (): FormField[] => {
  return [
    { name: 'name', label: 'Nama', type: 'text', required: true },
    { name: 'startDate', label: 'Tanggal Mulai', type: 'date', required: true },
    { name: 'endDate', label: 'Tanggal Selesai', type: 'date', required: true },
  ];
};
