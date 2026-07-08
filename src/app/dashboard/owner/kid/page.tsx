import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getKids } from '@/lib/actions/kid';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

import { KidActions } from './kid-actions';

export const metadata = { ...baseMetadata, title: 'Murid' };

const PAGE_SIZE = 50;

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  waiting: { label: 'Menunggu', variant: 'outline' },
  enrolled: { label: 'Terdaftar', variant: 'default' },
  alumni: { label: 'Alumni', variant: 'secondary' },
};

interface IKidListPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function KidListPage({ searchParams }: IKidListPageProps) {
  const { search, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const result = await getKids({ search, limit: PAGE_SIZE, offset });

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const kids = result.data;
  const totalItems = result.total ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Murid</h1>
          <p className="mt-1 text-sm text-zinc-500">Kelola data murid</p>
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
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
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
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-8">
            <p className="text-zinc-500">
              {search ? 'Murid tidak ditemukan' : 'Belum ada data murid'}
            </p>
          </div>
        ) : (
          kids.map((k) => {
            const badge = STATUS_BADGE[k.status] ?? STATUS_BADGE.waiting;
            return (
              <div
                key={k.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-900">{k.name}</p>
                    <p className="text-xs text-zinc-500">
                      {k.guardian?.name ?? '-'} • {formatDate(k.dob)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      badge.variant as 'default' | 'secondary' | 'outline'
                    }
                  >
                    {badge.label}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {k.enrolledTerm?.name ?? '-'}
                  </span>
                  <KidActions kidId={k.id} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 md:block">
        {kids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-zinc-500">
              {search ? 'Murid tidak ditemukan' : 'Belum ada data murid'}
            </p>
            {!search && (
              <Link
                href="/dashboard/owner/kid/create"
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
              >
                Tambah Murid
              </Link>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tanggal Lahir</TableHead>
                <TableHead>Wali Murid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Term</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kids.map((k) => {
                const badge = STATUS_BADGE[k.status] ?? STATUS_BADGE.waiting;
                return (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>{formatDate(k.dob)}</TableCell>
                    <TableCell>{k.guardian?.name ?? '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          badge.variant as 'default' | 'secondary' | 'outline'
                        }
                      >
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{k.enrolledTerm?.name ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <KidActions kidId={k.id} />
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
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 px-4 py-3">
          <p className="text-sm text-zinc-500">
            Menampilkan {offset + 1}–{Math.min(offset + PAGE_SIZE, totalItems)}{' '}
            dari {totalItems}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/dashboard/owner/kid?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' })
                )}
              >
                Sebelumnya
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/dashboard/owner/kid?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' })
                )}
              >
                Selanjutnya
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
