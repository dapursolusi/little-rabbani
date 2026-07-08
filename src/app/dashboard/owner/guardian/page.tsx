import Link from 'next/link';

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

import { getGuardians } from '@/lib/actions/guardian';
import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

import { GuardianActions } from './guardian-actions';

export const metadata = { ...baseMetadata, title: 'Wali Murid' };

export default async function GuardianListPage() {
  const result = await getGuardians();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const guardians = result.data;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Wali Murid</h1>
          <p className="mt-1 text-sm text-zinc-500">Kelola data wali murid</p>
        </div>
        <Link
          href="/dashboard/owner/guardian/create"
          className={cn(buttonVariants({ variant: 'default' }))}
        >
          Tambah Wali Murid
        </Link>
      </div>

      {/* Table */}
      {guardians.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-zinc-500">Belum ada data wali murid</p>
            <Link
              href="/dashboard/owner/guardian/create"
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
            >
              Tambah Wali Murid
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
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
        </div>
      )}
    </div>
  );
}
