import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import { LeanKid } from '@/features/kid/types';
import { Theme } from '@/features/theme/types';
import { getLocalDateString } from '@/utils/date-local';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

import { dcrAction, observationAction } from '../actions';
import {
  dailyClassReportFormFields,
  dcrObservationFormFields,
} from '../fields';
import { DCRObservation, DailyClassReport } from '../types';
import { dailyClassReportSchema, dcrObservationSchema } from '../validation';

export function DailyClassReportForm({
  classSessions,
  themes,
  defaultClassSessionId,
  existingDCR,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  defaultClassSessionId?: string;
  existingDCR?: DailyClassReport;
}) {
  const router = useRouter();
  const pushParam = (key: 'classSessionId', value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value ?? '');
    router.push(`?${params.toString()}`);
  };
  return (
    <FormFieldGenerator
      schema={dailyClassReportSchema}
      formFields={dailyClassReportFormFields({
        classSessions,
        themes,
        onValueChangeAction: (classSessionId) => {
          pushParam('classSessionId', classSessionId);
        },
      })}
      initialData={{
        classSessionId: defaultClassSessionId ?? '',
        date: getLocalDateString(),
        subThemeId: defaultClassSessionId
          ? (existingDCR?.subThemeId ?? '')
          : '',
        description: defaultClassSessionId
          ? (existingDCR?.description ?? '')
          : '',
      }}
      onSubmit={async (data) => {
        return await dcrAction.saveDCR(data);
      }}
      isEditMode
    />
  );
}

export function DCRObservationForm({
  kid,
  observation,
  isEditMode,
  disabled,
}: {
  kid: LeanKid;
  observation?: DCRObservation;
  isEditMode?: boolean;
  disabled?: boolean;
}) {
  return (
    <FormFieldGenerator
      schema={dcrObservationSchema}
      formFields={(watch) => dcrObservationFormFields({ watch })}
      initialData={{
        dcrId: isEditMode ? observation?.dcrId : crypto.randomUUID(),
        kidId: kid.id,
        attendance: isEditMode ? observation?.attendance : undefined,
        // DB nullable → undefined (zod .optional() rejects null)
        mood: isEditMode ? (observation?.mood ?? undefined) : undefined,
        appetite: isEditMode ? (observation?.appetite ?? undefined) : undefined,
        notes: isEditMode ? (observation?.notes ?? undefined) : undefined,
      }}
      onSubmit={async (data) => {
        if (disabled) return;

        if (isEditMode) {
          return await observationAction.updateKidObservation(data);
        }

        if (typeof window !== 'undefined') {
          const classSessionId = new URLSearchParams(
            window.location.search
          ).get('classSessionId');

          return await observationAction.createKidObservation({
            input: data,
            classSessionId: classSessionId ?? '',
          });
        }
      }}
      meta={{ label: 'Observasi Anak' }}
      isEditMode={isEditMode}
      disabled={disabled}
    />
  );
}
