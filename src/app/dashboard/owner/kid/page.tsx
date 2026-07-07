import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getKids } from '@/lib/actions/kid';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

import { KidActions } from './kid-actions';

export const metadata = { ...baseMetadata, title: 'Murid' };

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  waiting: { label: 'Menunggu', variant: 'outline' },
  enrolled: { label: 'Terdaftar', variant: 'default' },
  alumni: { label: 'Alumni', variant: 'secondary' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function KidListPage() {
  const result = await getKids();

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
          <h1 className="text-2xl font-semibold text-zinc-900">Murid</h1>
          <p className="mt-1 text-sm text-zinc-500">Kelola data murid</p>
        </div>
        <Link
          href="/dashboard/owner/kid/create"
          className={cn(buttonVariants({ variant: 'default' }))}
        >
          Tambah Murid
        </Link>
      </div>

      {/* Table */}
      {kids.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
          <p className="text-zinc-500">Belum ada data murid</p>
          <Link
            href="/dashboard/owner/kid/create"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
          >
            Tambah Murid
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
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
        </div>
      )}
    </div>
  );
}
