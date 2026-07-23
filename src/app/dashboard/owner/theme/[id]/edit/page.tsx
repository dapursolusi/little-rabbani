import { notFound } from 'next/navigation';

import { getTheme } from '@/features/theme/actions';

import { baseMetadata } from '@/lib/metadata';

import EditThemeForm from './edit-form';

export const metadata = { ...baseMetadata, title: 'Edit Tema' };

interface IEditThemePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditThemePage({ params }: IEditThemePageProps) {
  const { id } = await params;

  const result = await getTheme(id);

  if (!result.success) {
    notFound();
  }

  const data = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Edit Tema</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perbarui data tema</p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        <EditThemeForm
          id={id}
          initialData={{ name: data.name, color: data.color ?? '' }}
        />
      </div>
    </div>
  );
}
