import Link from 'next/link';

import { kidColumns } from '@/features/kid/components/columns';

import { EmptyState } from '@/components/shared/empty-state';
import { DataTable } from '@/components/shared/table/data-table';
import { DataTableRowActions } from '@/components/shared/table/data-table-row-action';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';

import { getKids } from '@/lib/actions/kid';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Murid' };

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  waiting: { label: 'Menunggu', variant: 'outline' },
  enrolled: { label: 'Terdaftar', variant: 'default' },
  alumni: { label: 'Alumni', variant: 'secondary' },
};

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form
            method="GET"
            action="/dashboard/owner/kid"
            className="flex gap-2"
          >
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="Cari murid..."
              className="rounded-md border px-3 py-1.5 text-sm"
            />
            <Button type="submit" variant="default" size="sm">
              Cari
            </Button>
          </form>
          <Link
            href="/dashboard/owner/kid/create"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            Tambah Murid
          </Link>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {kids.length === 0 ? (
          <EmptyState
            title={search ? 'Murid tidak ditemukan' : 'Belum ada data murid'}
          />
        ) : (
          kids.map((k) => {
            const badge = STATUS_BADGE[k.status] ?? STATUS_BADGE.waiting;
            return (
              <div key={k.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center ">
                  <div className="w-full">
                    <p className="font-medium text-foreground">{k.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {k.guardian?.name ?? '-'} • {formatDate(k.dob)}
                    </p>
                  </div>
                  <div className="flex items-baseline">
                    <DataTableRowActions id={k.id} />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {k.enrolledTerm?.name ?? '-'}
                  </span>
                  <Badge
                    variant={
                      badge.variant as 'default' | 'secondary' | 'outline'
                    }
                  >
                    {badge.label}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg md:block">
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
          />
        )}
      </div>
    </div>
  );
}
