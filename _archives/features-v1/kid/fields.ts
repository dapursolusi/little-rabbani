import type { FormField } from '@/types/field';

import { Guardian } from '../guardian/types';
import { Term } from '../term/types';

interface KidFieldParams {
  guardians: Guardian[];
  enrolledTerms: Term[];
}

export const kidFields = ({
  guardians,
  enrolledTerms,
}: KidFieldParams): FormField[] => {
  const guardianOptions = guardians.map((guardian) => ({
    value: guardian.id,
    label: guardian.name,
  }));
  const enrolledTermOptions = enrolledTerms.map((term) => ({
    value: term.id,
    label: term.name,
  }));
  return [
    {
      name: 'name',
      label: 'Nama',
      type: 'text',
      required: true,
    },
    {
      name: 'dob',
      label: 'Tanggal lahir',
      type: 'date',
      required: true,
    },
    {
      name: 'guardianId',
      label: 'Wali murid',
      type: 'select',
      required: true,
      selectOptions: guardianOptions,
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
      type: 'select',
      selectOptions: enrolledTermOptions,
    },
  ];
};
