import Link from 'next/link';
import { notFound } from 'next/navigation';

import { TermCohortForm } from '@/components/sections/term-cohort-form';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getTerm, getTermCohort, getWaitingListKids } from '@/lib/actions/term';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Kelola Murid' };

interface ICohortPageProps {
  params: Promise<{ id: string }>;
}

export default async function CohortPage({ params }: ICohortPageProps) {
  const { id } = await params;

  const [termResult, cohortResult, waitingResult] = await Promise.all([
    getTerm(id),
    getTermCohort(id),
    getWaitingListKids(),
  ]);

  if (!termResult.success) {
    notFound();
  }

  const termData = termResult.data;
  const cohort = cohortResult.success ? cohortResult.data : [];
  const waitingKids = waitingResult.success ? waitingResult.data : [];

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/owner/term"
            className="text-sm text-primary hover:underline"
          >
            &larr; Kembali
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          Kelola Murid - {termData.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {termData.startDate} — {termData.endDate}
          {termData.isActive && (
            <Badge variant="default" className="ml-2">
              Aktif
            </Badge>
          )}
        </p>
      </div>

      {/* Enrolled Kids */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-medium text-zinc-900">
          Murid Terdaftar ({cohort.length})
        </h2>
        {cohort.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-10">
            <p className="text-zinc-500">
              Belum ada murid terdaftar di term ini
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Wali Murid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohort.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>{k.guardian?.name ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="default">Terdaftar</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Bulk Enroll Section */}
      <div>
        <h2 className="mb-3 text-lg font-medium text-zinc-900">
          Daftarkan dari Waiting List
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6">
          <TermCohortForm
            termId={id}
            termName={termData.name}
            termIsActive={termData.isActive}
            waitingKids={waitingKids}
          />
        </div>
      </div>
    </div>
  );
}
