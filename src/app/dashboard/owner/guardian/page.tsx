import Link from 'next/link';

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

import { getGuardians } from '@/lib/actions/guardian';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

import { GuardianActions } from './guardian-actions';

export const metadata = { ...baseMetadata, title: 'Wali Murid' };

const PAGE_SIZE = 50;

interface IGuardianListPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function GuardianListPage({
  searchParams,
}: IGuardianListPageProps) {
  const { search, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const result = await getGuardians({ search, limit: PAGE_SIZE, offset });

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const guardians = result.data;
  const totalItems = result.total ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <section className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Wali Murid</h1>
          <p className="mt-1 text-sm text-zinc-500">Kelola data wali murid</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form
            method="GET"
            action="/dashboard/owner/guardian"
            className="flex gap-2"
          >
            <input
              type="text"
              name="search"
              defaultValue={search ?? ''}
              placeholder="Cari wali murid..."
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm min-h-[44px]"
            />
            <Button type="submit" variant="default" size="sm">
              Cari
            </Button>
          </form>
          <Link
            href="/dashboard/owner/guardian/create"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            Tambah Wali Murid
          </Link>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {guardians.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-zinc-500">
                {search
                  ? 'Wali murid tidak ditemukan'
                  : 'Belum ada data wali murid'}
              </p>
              {!search && (
                <Link
                  href="/dashboard/owner/guardian/create"
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
                >
                  Tambah Wali Murid
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          guardians.map((g) => {
            const enrolledCount = g.kids.filter(
              (k) => k.status === 'enrolled'
            ).length;
            return (
              <div
                key={g.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{g.name}</p>
                    <p className="text-xs text-zinc-500">
                      {g.phone} • {g.email ?? '-'}
                    </p>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {g.kids.length} murid
                    {enrolledCount > 0 && ` (${enrolledCount} aktif)`}
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <GuardianActions
                    guardianId={g.id}
                    hasKids={g.kids.length > 0}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 md:block">
        {guardians.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-zinc-500">
                {search
                  ? 'Wali murid tidak ditemukan'
                  : 'Belum ada data wali murid'}
              </p>
              {!search && (
                <Link
                  href="/dashboard/owner/guardian/create"
                  className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
                >
                  Tambah Wali Murid
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Jumlah Murid</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guardians.map((g) => {
                const enrolledCount = g.kids.filter(
                  (k) => k.status === 'enrolled'
                ).length;
                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.phone}</TableCell>
                    <TableCell>{g.email ?? '-'}</TableCell>
                    <TableCell>
                      {g.kids.length > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          {g.kids.length}
                          {enrolledCount > 0 && (
                            <span className="text-xs text-zinc-400">
                              ({enrolledCount} aktif)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <GuardianActions
                        guardianId={g.id}
                        hasKids={g.kids.length > 0}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

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
                href={`/dashboard/owner/guardian?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' })
                )}
              >
                Sebelumnya
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/dashboard/owner/guardian?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
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
