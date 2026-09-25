import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import { Theme } from '@/features/theme/types';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

import { dailyClassReportFormFields } from '../fields';
import { dailyReportClassSchema } from '../validation';

export default function DailyClassReportForm({
  classSessions,
  themes,
  defaultClassSessionId,
}: {
  classSessions: ClassSession[];
  themes: Theme[];
  defaultClassSessionId?: string;
}) {
  const router = useRouter();
  const pushParam = (key: 'classSessionId', value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value ?? '');
    router.push(`?${params.toString()}`);
  };
  return (
    <FormFieldGenerator
      schema={dailyReportClassSchema}
      formFields={dailyClassReportFormFields({
        classSessions,
        themes,
        onValueChangeAction: (classSessionId) => {
          pushParam('classSessionId', classSessionId);
        },
      })}
      initialData={{
        classSessionId: defaultClassSessionId ?? '',
        subThemeId: '',
        description: '',
      }}
      onSuccess={() => {}}
      onSubmit={() => {}}
    />
  );
}
