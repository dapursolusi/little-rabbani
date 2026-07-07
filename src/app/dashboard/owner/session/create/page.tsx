import Link from 'next/link';

import { SessionForm } from '@/components/sections/session-form';
import { buttonVariants } from '@/components/ui/button';

import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Tambah Sesi' };

interface ICreateSessionPageProps {
  searchParams: Promise<{ termId?: string }>;
}

export default async function CreateSessionPage({
  searchParams,
}: ICreateSessionPageProps) {
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
          Tambah Sesi
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Buat sesi baru untuk term ini
        </p>
      </div>

      <div className="mx-auto max-w-lg rounded-lg border border-zinc-200 bg-white p-6">
        <SessionForm termId={termId} />
      </div>
    </div>
  );
}
