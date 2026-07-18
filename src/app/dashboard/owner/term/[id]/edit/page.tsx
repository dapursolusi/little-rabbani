import { notFound } from 'next/navigation';

import { getTerm } from '@/features/term/actions';

import { TermFormWrapper } from '@/components/sections/term-form-wrapper';
import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';

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
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard/owner' },
          { label: 'Term', href: '/dashboard/owner/term' },
          { label: termData.name },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Edit Term</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perbarui data term</p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        <TermFormWrapper
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
