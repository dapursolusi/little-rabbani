'use client';

import { useRouter } from 'next/navigation';

import {
  createSessionType,
  updateSessionType,
} from '@/features/sessionType/actions';
import { sessionTypeFields } from '@/features/sessionType/fields';
import type { SessionTypeFormData } from '@/features/sessionType/schema';
import { toast } from 'sonner';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

interface ISessionTypeFormWrapperProps {
  mode: 'create' | 'edit';
  initialData: {
    id?: string;
    name: string;
    start: string;
    end: string;
  };
}

export function SessionTypeFormWrapper({
  mode,
  initialData,
}: ISessionTypeFormWrapperProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  return (
    <DefaultFormFields
      schemaKey="sessionType"
      initialData={initialData}
      formFields={sessionTypeFields()}
      onSubmit={async (data) => {
        const result = isEdit
          ? await updateSessionType(
              initialData.id!,
              data as SessionTypeFormData
            )
          : await createSessionType(data as SessionTypeFormData);

        if (result.success) {
          toast.success(
            isEdit
              ? 'Tipe sesi berhasil diperbarui. Versi baru telah dibuat.'
              : 'Tipe sesi berhasil dibuat'
          );
          router.push('/dashboard/owner/session-type');
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
                : 'Tambah Tipe Sesi'}
          </Button>
        </div>
      )}
    </DefaultFormFields>
  );
}
