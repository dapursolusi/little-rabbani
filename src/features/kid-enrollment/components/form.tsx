'use client';

import { useRouter } from 'next/navigation';

import type { ClassSession } from '@/features/class-session/types';
import * as kidEnrollmentActions from '@/features/kid-enrollment/actions';
import { kidEnrollmentFormFields } from '@/features/kid-enrollment/fields';
import { KidEnrollmentSchema } from '@/features/kid-enrollment/schema';
import { Kid } from '@/features/kid/types';
import type { Term } from '@/features/term/types';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

type KidEnrollmentFormProps = {
  terms: Term[];
  classSessions: ClassSession[];
  kids: Kid[];
};

export default function KidEnrollmentForm({
  terms,
  classSessions,
  kids,
}: KidEnrollmentFormProps) {
  const router = useRouter();
  return (
    <FormFieldGenerator
      formFields={kidEnrollmentFormFields({ terms, classSessions, kids })}
      schema={KidEnrollmentSchema}
      initialData={{
        termId: terms[0]?.id,
        classSessionId: classSessions[0]?.id,
        kids: [],
      }}
      onSubmit={(data) => {
        return kidEnrollmentActions.createKidsEnrollments(data);
      }}
      onSuccess={() => router.push('/dashboard/registration')}
    />
  );
}
