'use client';

import { createKid, updateKid } from '@/features/kids/actions';
import { KidGuardianFormSchema } from '@/features/kids/schemas';
import type { FormField } from '@/types/field';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

type KidFormFieldsProps = {
  mode: 'create' | 'edit';
  initialData?: { id?: string; kid?: object; guardian?: object };
  formFields?: FormField[];
  onSuccess?: () => void;
};

export default function KidForm({
  mode,
  initialData = {},
  formFields,
  onSuccess,
}: KidFormFieldsProps) {
  const isEdit = mode === 'edit';

  return (
    <FormFieldGenerator
      schema={KidGuardianFormSchema}
      initialData={initialData}
      formFields={formFields ?? []}
      meta={{ label: 'Data murid' }}
      isEditing={isEdit}
      onSuccess={onSuccess}
      onSubmit={async (data) => {
        const result = isEdit
          ? await updateKid(initialData.id!, {
              kid: data.kid,
              guardian: data.guardian,
            })
          : await createKid({ kid: data.kid, guardian: data.guardian });
        return result;
      }}
    />
  );
}
