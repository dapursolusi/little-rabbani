import { FormField } from '@/types/field';

export const kidFields: FormField[] = [
  {
    name: 'name',
    label: 'Nama',
    type: 'text',
    required: true,
  },
  {
    name: 'dob',
    label: 'Tanggal lahir',
    type: 'text',
    required: true,
  },
  {
    name: 'guardianId',
    label: 'Wali murid',
    type: 'text',
    required: true,
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    selectOptions: [
      { value: 'waiting', label: 'Menunggu' },
      { value: 'enrolled', label: 'Terdaftar' },
      { value: 'alumni', label: 'Alumni' },
    ],
  },
  {
    name: 'enrolledTermId',
    label: 'Term',
    type: 'text',
  },
];
