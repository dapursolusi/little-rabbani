'use client';

import { useRouter } from 'next/navigation';

import { createTheme } from '@/features/theme/actions';
import { themeFields } from '@/features/theme/fields';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

export default function CreateThemePage() {
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Tambah Tema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan tema pembelajaran baru
        </p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        <DefaultFormFields
          schemaKey="theme"
          formFields={themeFields()}
          initialData={{ name: '', color: '' }}
          onSubmit={async (data) => {
            const result = await createTheme(data);
            if (result.success) {
              router.push('/dashboard/owner/theme');
              router.refresh();
            }
            return result;
          }}
        >
          <Button type="submit" className="w-full">
            Simpan
          </Button>
        </DefaultFormFields>
      </div>
    </div>
  );
}
