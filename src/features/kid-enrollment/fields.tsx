import { ClassSession } from '@/features/class-session/types';
import { Term } from '@/features/term/types';
import { FormField } from '@/types/field';

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
    {
      name: 'termId',
      label: 'Batch',
      type: 'select',
      fullWidth: true,
      selectOptions: terms.map((term) => ({
        value: term.id,
        label: term.name,
      })),
    },
    {
      name: 'classSessionId',
      label: 'Sesi',
      type: 'select',
      fullWidth: true,
      selectOptions: classSessions.map((cs) => ({
        value: cs.id,
        label: `${cs.name} (${cs.startTime} - ${cs.endTime})`,
      })) || [{ value: 'all', label: 'Semua Sesi' }],
    },
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
