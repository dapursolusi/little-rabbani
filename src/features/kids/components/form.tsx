'use client';

import { useRouter } from 'next/navigation';

import { createKid, updateKid } from '@/features/kids/actions';
import { kidFormFields } from '@/features/kids/components/fields';
import {
  type KidGuardianFormInput,
  KidGuardianFormSchema,
} from '@/features/kids/schemas';
import { z } from 'zod';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';

type KidFormFieldsProps = {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    kid?: object;
    guardian?: object;
    guardianId?: string;
    guardianMode?: 'new' | 'existing';
  };
};

// Engine pins `schema` to `z.ZodObject`; a discriminated union isn't one.
// Cast at the seam but keep `_output` = the union so `onSubmit` narrows.
const schema =
  KidGuardianFormSchema as unknown as z.ZodObject<z.ZodRawShape> & {
    _output: KidGuardianFormInput;
  };

export default function KidForm({
  mode,
  initialData = {},
}: KidFormFieldsProps) {
  const isEdit = mode === 'edit';
  const route = useRouter();

  // Edit-existing: picker renders a summary without re-searching. The search
  // path stores its own pick locally, so this is only the fallback for edit mode.
  const guardian = initialData.guardian as
    { name?: string; phone?: string; email?: string } | undefined;
  const summary =
    initialData.guardianId && guardian
      ? {
          id: initialData.guardianId,
          name: guardian.name ?? '',
          phone: guardian.phone ?? '',
          email: guardian.email ?? null,
          secondContactName: null,
          secondContactPhone: null,
          kids: [],
        }
      : undefined;

  return (
    <FormFieldGenerator
      schema={schema}
      initialData={initialData}
      formFields={(watch) => kidFormFields(watch, summary)}
      meta={{ label: 'Data murid' }}
      isEditing={isEdit}
      onSuccess={() => route.push('/dashboard/kid')}
      onSubmit={async (data) => {
        const result =
          data.guardianMode === 'existing'
            ? isEdit
              ? await updateKid(initialData.id!, {
                  kid: data.kid,
                  guardianId: data.guardianId,
                })
              : await createKid({
                  kid: data.kid,
                  guardianId: data.guardianId,
                })
            : isEdit
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
