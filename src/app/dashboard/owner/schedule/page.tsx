import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';

import { getTerms } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Jadwal Mingguan' };

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  const days = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    "Jum'at",
    'Sabtu',
  ];
  const dayName = days[date.getDay()];
  const formatted = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${dayName}, ${formatted}`;
}

export default async function ScheduleSelectorPage() {
  const result = await getTerms();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const terms = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Jadwal Mingguan
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Atur jadwal aktivitas dan outing untuk setiap sesi
        </p>
      </div>

      {terms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
          <p className="text-zinc-500">
            Belum ada term. Buat term terlebih dahulu.
          </p>
          <Link
            href="/dashboard/owner/term/create"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
          >
            Tambah Term
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/owner/schedule/${t.id}`}
              className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-zinc-900">{t.name}</h3>
                {t.isActive && (
                  <Badge variant="default" className="ml-2">
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {formatDate(t.startDate)} — {formatDate(t.endDate)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {t.sessions.length} sesi
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
