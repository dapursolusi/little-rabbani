import { notFound } from 'next/navigation';

import { ActivityForm } from '@/components/sections/activity-form';

import { getActivity } from '@/lib/actions/activity';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Aktivitas' };

interface IEditActivityPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditActivityPage({
  params,
}: IEditActivityPageProps) {
  const { id } = await params;

  const result = await getActivity(id);

  if (!result.success) {
    notFound();
  }

  const activityData = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Aktivitas</h1>
        <p className="mt-1 text-sm text-zinc-500">Perbarui data aktivitas</p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <ActivityForm
          mode="edit"
          initialData={{
            id: activityData.id,
            name: activityData.name,
            category: activityData.category,
          }}
        />
      </div>
    </div>
  );
}
