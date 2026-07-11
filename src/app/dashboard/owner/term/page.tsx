import Link from 'next/link';

import { TermActions } from '@/components/sections/term-actions';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getTerms } from '@/lib/actions/term';
import { formatDate } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Term' };

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
          <h1 className="text-2xl font-semibold text-foreground">Term</h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyState
              title="Belum ada data term"
              actionLabel="Tambah Term"
              actionHref="/dashboard/owner/term/create"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
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
