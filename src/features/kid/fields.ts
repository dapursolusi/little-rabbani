import { FormField } from '@/types/field';

export const kidFields: FormField[] = [
  {
    name: 'name',
    label: 'Nama',
    required: true,
  },
  {
    name: 'dob',
    label: 'Tanggal lahir',
    required: true,
  },
  {
    name: 'guardianId',
    label: 'Wali murid',
    required: true,
  },
  {
    name: 'status',
    label: 'Status',
  },
  {
    name: 'enrolledTermId',
    label: 'Term',
  },
];
