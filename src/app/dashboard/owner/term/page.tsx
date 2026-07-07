import Link from 'next/link';

import { TermActions } from '@/components/sections/term-actions';
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

import { getTerms } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Term' };

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function TermListPage() {
  const result = await getTerms();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const terms = result.data;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Term</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola periode pembelajaran
          </p>
        </div>
        <Link
          href="/dashboard/owner/term/create"
          className={cn(buttonVariants({ variant: 'default' }))}
        >
          Tambah Term
        </Link>
      </div>

      {/* Table */}
      {terms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
          <p className="text-zinc-500">Belum ada data term</p>
          <Link
            href="/dashboard/owner/term/create"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
          >
            Tambah Term
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Tanggal Selesai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{formatDate(t.startDate)}</TableCell>
                  <TableCell>{formatDate(t.endDate)}</TableCell>
                  <TableCell>
                    {t.isActive ? (
                      <Badge variant="default">Aktif</Badge>
                    ) : (
                      <Badge variant="outline">Tidak Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell>{t.sessions.length}</TableCell>
                  <TableCell className="text-right">
                    <TermActions
                      termId={t.id}
                      sessionCount={t.sessions.length}
                      isActive={t.isActive}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
