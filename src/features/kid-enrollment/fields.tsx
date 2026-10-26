import { ClassSession } from '@/features/class-session/types';
import { Term } from '@/features/term/types';
import { FormField } from '@/types/field';

import {
  classSessionIdField,
  termIdField,
} from '@/components/shared/form/fields';

import { Kid } from '../kid/types';
import SelectEnrolledKidsTable from './components/select-enrolled-kids';

export const kidEnrollmentFormFields = ({
  terms,
  classSessions,
  kids,
}: {
  terms: Term[];
  classSessions: ClassSession[];
  kids: Kid[];
}): FormField[] => {
  return [
    termIdField({ terms }),
    classSessionIdField({
      classSessions,
      extraOptions: [{ value: 'all', label: 'Semua Sesi' }],
    }),
    {
      name: 'kids',
      label: 'Anak-anak',
      type: 'custom',
      fullWidth: true,
      render: ({ field }) => (
        <SelectEnrolledKidsTable
          kids={kids}
          value={(field.value as Kid[] | undefined) ?? []}
          onChange={field.onChange}
        />
      ),
    },
  ];
};

export const updateKidEnrollmentFormFields = [];
