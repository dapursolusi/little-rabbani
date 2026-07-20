import type { FormField } from '@/types/field';

export function sessionTypeFields(): FormField[] {
  return [
    { name: 'name', label: 'Nama Sesi', type: 'text', required: true },
    { name: 'start', label: 'Jam Mulai', type: 'time', required: true },
    { name: 'end', label: 'Jam Selesai', type: 'time', required: true },
  ];
}
