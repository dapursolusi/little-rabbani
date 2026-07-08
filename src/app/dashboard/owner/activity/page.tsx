import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getActivities } from '@/lib/actions/activity';
import { getCategoryLabel } from '@/lib/activity-utils';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

import { ActivityActions } from './activity-actions';

export const metadata = { ...baseMetadata, title: 'Katalog Aktivitas' };

const PAGE_SIZE = 50;

interface IActivityListPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ActivityListPage({
  searchParams,
}: IActivityListPageProps) {
  const { search, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const result = await getActivities({ search, limit: PAGE_SIZE, offset });

  if (!result.success) {
    return (
      <section className="p-4 text-center text-destructive">
        {result.error}
      </section>
    );
  }

  const activities = result.data;
  const totalItems = result.total ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const activeActivities = activities.filter((a) => !a.isDeleted);
  const archivedActivities = activities.filter((a) => a.isDeleted);

  return (
    <section className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Katalog Aktivitas
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Kelola daftar aktivitas</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form
            method="GET"
            action="/dashboard/owner/activity"
            className="flex gap-2"
          >
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="Cari aktivitas..."
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm min-h-[44px]"
            />
            <Button type="submit" variant="default" size="sm">
              Cari
            </Button>
          </form>
          <Link
            href="/dashboard/owner/activity/import"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Import CSV
          </Link>
          <Link
            href="/dashboard/owner/activity/create"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            Tambah Aktivitas
          </Link>
        </div>
      </div>

      {/* Active Activities */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-zinc-800">
          Aktivitas Aktif ({activeActivities.length})
        </h2>
        {activeActivities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-zinc-500">
                {search
                  ? 'Aktivitas tidak ditemukan'
                  : 'Belum ada data aktivitas'}
              </p>
              {!search && (
                <Link
                  href="/dashboard/owner/activity/create"
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
                >
                  Tambah Aktivitas
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeActivities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getCategoryLabel(a.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Aktif</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ActivityActions
                        activityId={a.id}
                        isDeleted={a.isDeleted}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Archived Activities */}
      {archivedActivities.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-zinc-800">
            Diarsipkan ({archivedActivities.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedActivities.map((a) => (
                  <TableRow key={a.id} className="bg-zinc-50 text-zinc-500">
                    <TableCell className="font-medium">
                      {a.name}{' '}
                      <span className="text-xs text-zinc-400">
                        (diarsipkan)
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryLabel(a.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Diarsipkan</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ActivityActions
                        activityId={a.id}
                        isDeleted={a.isDeleted}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between border-t border-zinc-200 px-4 py-3">
          <p className="text-sm text-zinc-500">
            Menampilkan {offset + 1}–{Math.min(offset + PAGE_SIZE, totalItems)}{' '}
            dari {totalItems}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/dashboard/owner/activity?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' })
                )}
              >
                Sebelumnya
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/dashboard/owner/activity?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' })
                )}
              >
                Selanjutnya
              </Link>
            )}
          </div>
        </nav>
      )}
    </section>
  );
}
