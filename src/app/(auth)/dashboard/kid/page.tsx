import Link from 'next/link';

import { getKids } from '@/features/kids/actions';
import { Kid } from '@/features/kids/types';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatAge } from '@/lib/format';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Murid' };

interface KidListPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function KidListPage({ searchParams }: KidListPageProps) {
  const { search } = await searchParams;
  const result = await getKids({ ...(search ? { search } : {}), limit: 1000 });

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const kids = result.data as unknown as Kid[];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Murid</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data murid dan wali
          </p>
        </div>
        <Link
          href="/dashboard/kid/create"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          Tambah Murid
        </Link>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Usia</TableHead>
              <TableHead>Jenis Kelamin</TableHead>
              <TableHead>Wali</TableHead>
              <TableHead>Hubungan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kids.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Belum ada murid.
                </TableCell>
              </TableRow>
            ) : (
              kids.map((kid) => (
                <TableRow key={kid.id}>
                  <TableCell className="font-medium">{kid.name}</TableCell>
                  <TableCell>{formatAge(kid.dob)}</TableCell>
                  <TableCell>
                    {kid.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                  </TableCell>
                  <TableCell>{kid.guardian?.name ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {RELATIONSHIP_LABELS[kid.relationship] ??
                        kid.relationship}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/kid/${kid.id}/edit`}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: 'Ibu',
  father: 'Ayah',
  brother_sister: 'Kakak / Adik',
  grandparent: 'Kakek / Nenek',
  aunt_uncle: 'Bibi / Paman',
  other: 'Wali Lainnya',
};
