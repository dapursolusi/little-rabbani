'use client';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

import { createClassSession } from '../actions';
import { classSessionFormFields } from '../fields';
import { ClassSessionSchema } from '../schema';

export default function ClassSessionForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  return (
    <FormFieldGenerator
      schema={ClassSessionSchema}
      formFields={classSessionFormFields}
      initialData={{
        name: '',
        startDate: new Date().getTime(),
        endDate: new Date().getTime(),
      }}
      onSuccess={onSuccess}
      onSubmit={async (data) => {
        return createClassSession(data);
      }}
    />
  );
}
