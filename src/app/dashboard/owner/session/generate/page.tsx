import Link from 'next/link';

import { SessionGenerateForm } from '@/components/sections/session-generate-form';
import { buttonVariants } from '@/components/ui/button';

import { getTerm } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Generate Sesi' };

interface IGenerateSessionPageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function GenerateSessionPage({
  searchParams,
}: IGenerateSessionPageProps) {
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
          >
            &larr; Kembali
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Generate Sesi Berulang
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Buat sesi otomatis untuk term &ldquo;{termData.name}&rdquo;
        </p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <SessionGenerateForm
          termId={termId}
          startDate={termData.startDate}
          endDate={termData.endDate}
        />
      </div>
    </div>
  );
}
