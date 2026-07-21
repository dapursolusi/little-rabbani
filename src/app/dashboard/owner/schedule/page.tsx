import Link from 'next/link';

import { getTerms } from '@/features/term/actions';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';

import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Jadwal Mingguan' };

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
        <h1 className="text-2xl font-semibold text-foreground">
          Jadwal Mingguan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur jadwal aktivitas dan outing untuk setiap sesi
        </p>
      </div>

      {terms.length === 0 ? (
        <EmptyState
          title="Belum ada term. Buat term terlebih dahulu."
          actionLabel="Tambah Term"
          actionHref="/dashboard/owner/term/create"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/owner/schedule/${t.id}`}
              className="rounded-lg border bg-background p-4 transition-colors hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{t.name}</h3>
                {t.isActive && (
                  <Badge variant="default" className="ml-2">
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(t.startDate)} — {formatDate(t.endDate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {t.startDate} — {t.endDate}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
