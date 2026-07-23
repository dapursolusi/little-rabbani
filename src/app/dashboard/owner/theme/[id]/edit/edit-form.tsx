'use client';

import { useRouter } from 'next/navigation';

import { updateTheme } from '@/features/theme/actions';
import { themeFields } from '@/features/theme/fields';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

interface IEditThemeFormProps {
  id: string;
  initialData: { name: string; color: string };
}

export default function EditThemeForm({
  id,
  initialData,
}: IEditThemeFormProps) {
  const router = useRouter();

  return (
    <DefaultFormFields
      schemaKey="theme"
      formFields={themeFields()}
      initialData={initialData}
      onSubmit={async (data) => {
        const result = await updateTheme(id, data);
        if (result.success) {
          router.push('/dashboard/owner/theme');
          router.refresh();
        }
        return result;
      }}
    >
      <Button type="submit" className="w-full">
        Simpan Perubahan
      </Button>
    </DefaultFormFields>
  );
}
