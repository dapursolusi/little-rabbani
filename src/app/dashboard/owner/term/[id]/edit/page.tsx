import { notFound } from 'next/navigation';

import { TermForm } from '@/components/sections/term-form';

import { getTerm } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Term' };

interface IEditTermPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTermPage({ params }: IEditTermPageProps) {
  const { id } = await params;

  const result = await getTerm(id);

  if (!result.success) {
    notFound();
  }

  const termData = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Term</h1>
        <p className="mt-1 text-sm text-zinc-500">Perbarui data term</p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <TermForm
          mode="edit"
          initialData={{
            id: termData.id,
            name: termData.name,
            startDate: termData.startDate,
            endDate: termData.endDate,
          }}
        />
      </div>
    </div>
  );
}
