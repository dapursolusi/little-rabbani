'use client';

import { useRouter } from 'next/navigation';

import { createTerm, updateTerm } from '@/features/term/actions';
import type { TermFormData } from '@/features/term/schema';
import { toast } from 'sonner';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

interface TermFormWrapperProps {
  mode: 'create' | 'edit';
  initialData: {
    id?: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export function TermFormWrapper({ mode, initialData }: TermFormWrapperProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  return (
    <DefaultFormFields
      schemaKey="term"
      initialData={initialData}
      formFields={[
        /* termFields inlined — no data deps */
        { name: 'name', label: 'Nama Term', type: 'text', required: true },
        {
          name: 'startDate',
          label: 'Tanggal Mulai',
          type: 'date',
          required: true,
        },
        {
          name: 'endDate',
          label: 'Tanggal Selesai',
          type: 'date',
          required: true,
        },
      ]}
      onSubmit={async (data) => {
        const result = isEdit
          ? await updateTerm(initialData.id!, data as TermFormData)
          : await createTerm(data as TermFormData);

        if (result.success) {
          toast.success(
            isEdit ? 'Term berhasil diperbarui' : 'Term berhasil dibuat'
          );
          router.push('/dashboard/owner/term');
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
                : 'Tambah Term'}
          </Button>
        </div>
      )}
    </DefaultFormFields>
  );
}
