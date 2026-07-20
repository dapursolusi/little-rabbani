import { notFound } from 'next/navigation';

import { getSessionType } from '@/features/sessionType/actions';

import { SessionTypeFormWrapper } from '@/components/sections/session-type-form-wrapper';
import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Tipe Sesi' };

interface IEditSessionTypePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSessionTypePage({
  params,
}: IEditSessionTypePageProps) {
  const { id } = await params;
  const result = await getSessionType(id);

  if (!result.success) notFound();

  const item = result.data;

  return (
    <div className="p-4 sm:p-6">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard/owner' },
          { label: 'Tipe Sesi', href: '/dashboard/owner/session-type' },
          { label: item.name },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Edit Tipe Sesi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perbarui tipe sesi. Jika waktu berubah, versi lama akan dinonaktifkan
          dan versi baru dibuat.
        </p>
      </div>
      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        <SessionTypeFormWrapper
          mode="edit"
          initialData={{
            id: item.id,
            name: item.name,
            start: item.start,
            end: item.end,
          }}
        />
      </div>
    </div>
  );
}
