import { FormField } from '@/types/field';

export const classSessionFormFields: FormField[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    required: true,
  },
  {
    name: 'startTime',
    type: 'time',
    label: 'Jam Dimulai',
    required: true,
  },
  {
    name: 'endTime',
    type: 'time',
    label: 'Jam Berakhir',
    required: true,
  },
];
