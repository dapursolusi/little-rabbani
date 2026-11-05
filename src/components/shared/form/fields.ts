import { ClassSession } from '@/features/class-session/types';
import { Term } from '@/features/term/types';
import { FormFieldSelectInput, SelectOption } from '@/types/field';

export const termIdField = ({
  terms,
  onValueChangeAction,
}: {
  terms: Term[];
  onValueChangeAction?: (val: string) => void;
}): FormFieldSelectInput => ({
  name: 'termId',
  label: 'Batch',
  type: 'select',
  fullWidth: true,
  selectOptions: terms.map((term) => ({
    value: term.id,
    label: term.name,
  })),
  onValueChange: onValueChangeAction,
});

export const classSessionIdField = ({
  classSessions,
  extraOptions,
  onValueChangeAction,
}: {
  classSessions: ClassSession[];
  extraOptions?: SelectOption[];
  onValueChangeAction?: (val: string) => void;
}): FormFieldSelectInput => ({
  name: 'classSessionId',
  label: 'Sesi Kelas',
  type: 'select',
  selectOptions: extraOptions
    ? [
        ...classSessions.map((cs) => ({
          value: cs.id,
          label: `${cs.name} (${cs.startTime} - ${cs.endTime})`,
        })),
        ...(extraOptions ?? []),
      ]
    : classSessions.map((cs) => ({
        value: cs.id,
        label: `${cs.name} (${cs.startTime} - ${cs.endTime})`,
      })),
  onValueChange: onValueChangeAction,
});
