import Link from 'next/link';

import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { SessionGenerateForm } from '@/components/sections/session-generate-form';
import { buttonVariants } from '@/components/ui/button';

import { getTerm } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Buat Sesi Berulang' };

interface IBuatSessionPageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function BuatSessionPage({
  searchParams,
}: IBuatSessionPageProps) {
  const { termId } = await searchParams;

  if (!termId) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Term tidak dipilih</p>
        <Link
          href="/dashboard/owner/session"
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
        >
          Pilih Term
        </Link>
      </div>
    );
  }

  const result = await getTerm(termId);

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const termData = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/owner/session?termId=${termId}`}
            className="text-sm text-primary hover:underline"
            data-icon="inline-start"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
            Kembali
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Buat Sesi Berulang
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat sesi otomatis untuk term &ldquo;{termData.name}&rdquo;
        </p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border bg-card p-6">
        <SessionGenerateForm
          termId={termId}
          startDate={termData.startDate}
          endDate={termData.endDate}
        />
      </div>
    </div>
  );
}
