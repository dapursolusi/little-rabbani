'use client';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

import { createTerm } from '../actions';
import { termFormFields } from '../fields';
import { TermSchema } from '../schema';

export default function TermForm() {
  return (
    <FormFieldGenerator
      schema={TermSchema}
      formFields={termFormFields()}
      initialData={{
        name: '',
        startDate: new Date(),
        endDate: new Date(),
      }}
      onSubmit={async (data) => {
        createTerm(data);
      }}
    />
  );
}
