'use client';

import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import { Term } from '@/features/term/types';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

import { monthlyReportFormFields } from '../fields';
import { monthlyReportSchema } from '../validation';

interface MonthlyReportClientProps {
  currentTermId: string;
  currentClassSessionId: string;
  terms: Term[];
  classSessions: ClassSession[];
}

export default function MonthlyReportClient({
  terms,
  classSessions,
}: MonthlyReportClientProps) {
  const router = useRouter();
  return (
    <div>
      <FormFieldGenerator
        formFields={monthlyReportFormFields({ terms, classSessions, router })}
        initialData={{
          termId: '',
          classSessionId: '',
        }}
        schema={monthlyReportSchema}
        onSubmitAction={() => {}}
      />
    </div>
  );
}
