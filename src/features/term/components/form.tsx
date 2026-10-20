'use client';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

import { createTerm } from '../actions';
import { termFormFields } from '../fields';
import { TermSchema } from '../validation';

export default function TermForm({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <FormFieldGenerator
      schema={TermSchema}
      formFields={termFormFields()}
      initialData={{
        name: '',
        startDate: new Date(),
        endDate: new Date(),
      }}
      onSubmitAction={async (data) => {
        return createTerm(data);
      }}
      onSuccessAction={onSuccess}
    />
  );
}
