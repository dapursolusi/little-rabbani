import { FormField } from '@/types/field';

export const guardianFields = (): FormField[] => [
  {
    name: 'name',
    label: 'Nama',
    type: 'text',
    required: true,
  },
  {
    name: 'phone',
    label: 'Nomor telepon',
    type: 'text',
    required: true,
  },
  {
    name: 'email',
    label: 'E-Mail',
    type: 'email',
    required: true,
  },
  {
    name: 'secondContactName',
    label: 'Nama kontak 2',
    type: 'text',
  },
  {
    name: 'secondContactPhone',
    label: 'Nomor telepon kontak 2',
    type: 'text',
  },
];
