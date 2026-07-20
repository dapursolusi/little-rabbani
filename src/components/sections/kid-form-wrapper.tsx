'use client';

import { useRouter } from 'next/navigation';

import { createKid, updateKid } from '@/features/kid/actions';
import type { KidFormData } from '@/features/kid/schema';
import type { FormField } from '@/types/field';
import { toast } from 'sonner';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

interface KidFormWrapperProps {
  mode: 'create' | 'edit';
  initialData: {
    id?: string;
    name: string;
    dob: string;
    guardianId: string;
    status: 'waiting' | 'enrolled' | 'alumni';
    enrolledTermId: string;
  };
  formFields: FormField[];
}

export function KidFormWrapper({
  mode,
  initialData,
  formFields,
}: KidFormWrapperProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  return (
    <DefaultFormFields
      schemaKey="kid"
      initialData={initialData}
      formFields={formFields}
      onSubmit={async (data) => {
        const result = isEdit
          ? await updateKid(initialData.id!, data as KidFormData)
          : await createKid(data as KidFormData);

        if (result.success) {
          toast.success(
            isEdit ? 'Murid berhasil diperbarui' : 'Murid berhasil dibuat'
          );
          router.push('/dashboard/owner/kid');
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }}
    >
      {({ isSubmitting }) => (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Menyimpan...'
              : isEdit
                ? 'Simpan Perubahan'
                : 'Tambah Murid'}
          </Button>
        </div>
      )}
    </DefaultFormFields>
  );
}
