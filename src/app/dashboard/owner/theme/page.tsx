import Link from 'next/link';

import { getThemes } from '@/features/theme/actions';

import { EmptyState } from '@/components/shared/empty-state';
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

import { baseMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';

export const metadata = { ...baseMetadata, title: 'Tema' };

export default async function ThemeListPage() {
  const result = await getThemes();

  if (!result.success) {
    return (
      <section className="p-4 text-center text-destructive">
        {result.error}
      </section>
    );
  }

  const themes = result.data;

  return (
    <section className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tema</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola daftar tema pembelajaran
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/dashboard/owner/theme/create"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            Tambah Tema
          </Link>
        </div>
      </div>

      {/* Theme list */}
      {themes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyState
              title="Belum ada data tema"
              actionLabel="Tambah Tema"
              actionHref="/dashboard/owner/theme/create"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Warna</TableHead>
                <TableHead>Jumlah Sub Tema</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {themes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    {t.color ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block size-4 rounded-full border"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {t.color}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    —
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/owner/theme/${t.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'sm' })
                      )}
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
