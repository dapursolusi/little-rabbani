import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { SessionEditForm } from '@/components/sections/session-edit-form';
import { Card, CardContent } from '@/components/ui/card';

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
              data-icon="inline-start"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} />
              Kembali
            </Link>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Edit Sesi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Perbarui data sesi</p>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardContent className="p-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
