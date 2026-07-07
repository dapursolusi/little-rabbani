import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SessionEditForm } from '@/components/sections/session-edit-form';

import { getSession } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Sesi' };

interface IEditSessionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ termId?: string }>;
}

export default async function EditSessionPage({
  params,
  searchParams,
}: IEditSessionPageProps) {
  const { id } = await params;
  const { termId } = await searchParams;

  const result = await getSession(id);

  if (!result.success) {
    notFound();
  }

  const sessionData = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          {termId && (
            <Link
              href={`/dashboard/owner/session?termId=${termId}`}
              className="text-sm text-primary hover:underline"
            >
              &larr; Kembali
            </Link>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Edit Sesi</h1>
        <p className="mt-1 text-sm text-zinc-500">Perbarui data sesi</p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <SessionEditForm
          initialData={{
            id: sessionData.id,
            termId: termId ?? sessionData.termId,
            date: sessionData.date,
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            label: sessionData.label,
            isHoliday: sessionData.isHoliday,
            holidayReason: sessionData.holidayReason ?? '',
          }}
        />
      </div>
    </div>
  );
}
