import { kidColumns } from '@/features/kid/components/columns';
import { STATUS_BADGE } from '@/features/kid/constants';

import { EmptyState } from '@/components/shared/empty-state';
import { DataTable } from '@/components/shared/table/data-table';
import { DataTableRowActions } from '@/components/shared/table/data-table-row-action';
import { Badge } from '@/components/ui/badge';

import { getKids } from '@/lib/actions/kid';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Murid' };

interface IKidListPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function KidListPage({ searchParams }: IKidListPageProps) {
  const { search } = await searchParams;

  const result = await getKids({ ...(search ? { search } : {}), limit: 1000 });

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const kids = result.data;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Murid</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data murid
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg">
        {kids.length === 0 ? (
          <EmptyState
            title={search ? 'Murid tidak ditemukan' : 'Belum ada data murid'}
            actionLabel={!search ? 'Tambah Murid' : undefined}
            actionHref={!search ? '/dashboard/owner/kid/create' : undefined}
          />
        ) : (
          <DataTable
            columns={kidColumns}
            data={kids.map((kid) => ({
              ...kid,
              guardianName: kid.guardian?.name ?? '-',
              enrolledTermName: kid.enrolledTerm?.name ?? '-',
              enrolledTermId: kid.enrolledTerm?.id ?? undefined,
            }))}
            createButton="/dashboard/owner/kid/create"
          />
        )}
      </div>
    </div>
  );
}
