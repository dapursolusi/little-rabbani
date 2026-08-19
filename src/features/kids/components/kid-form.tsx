'use client';

import { useRouter } from 'next/navigation';

import { createKid, updateKid } from '@/features/kids/actions';
import { kidFormFields } from '@/features/kids/form-fields';
import { KidGuardianFormSchema } from '@/features/kids/schemas';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

type KidFormFieldsProps = {
  mode: 'create' | 'edit';
  initialData?: { id?: string; kid?: object; guardian?: object };
  onSuccess?: () => void;
};

export default function KidForm({
  mode,
  initialData = {},
  onSuccess,
}: KidFormFieldsProps) {
  const isEdit = mode === 'edit';
  const route = useRouter();

  return (
    <FormFieldGenerator
      schema={KidGuardianFormSchema}
      initialData={initialData}
      formFields={kidFormFields()}
      meta={{ label: 'Data murid' }}
      isEditing={isEdit}
      onSuccess={() => route.push('/dashboard/kid')}
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
