import Link from 'next/link';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';

import { getSessionsForDcr } from '@/lib/actions/dcr';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'DCR / Observasi Kelas' };

export default async function DcrPickerPage() {
  const result = await getSessionsForDcr();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const sessions = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          DCR / Observasi Kelas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat atau edit laporan harian untuk setiap tipe sesi
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="Belum ada tipe sesi" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((st) => {
            const hasDcr = st.dcrs && st.dcrs.length > 0;
            return (
              <Link
                key={st.id}
                href={`/dashboard/owner/dcr/${st.id}`}
                className={`rounded-lg border bg-background p-4 transition-colors hover:shadow-sm ${
                  hasDcr ? 'border-success/30' : 'border'
                }`}
              >
                <p className="font-medium text-foreground">{st.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {st.start} — {st.end}
                </p>
                {hasDcr ? (
                  <Badge
                    variant="default"
                    className="bg-success/10 text-success hover:bg-success/10 mt-2"
                  >
                    {st.dcrs.length} Laporan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-2">
                    Belum
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
