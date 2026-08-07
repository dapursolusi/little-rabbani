import Link from 'next/link';

import { db } from '@/db';
import { kid, term } from '@/db/schema';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { eq } from 'drizzle-orm';

import { getQuarterlyReport } from '@/lib/actions/quarterly-report';
import { baseMetadata } from '@/lib/metadata';

import { QuarterlyReportClient } from './report-client';

export const metadata = { ...baseMetadata, title: 'Laporan Triwulanan' };

interface IQuarterlyReportPageProps {
  params: Promise<{ kidId: string }>;
  searchParams: Promise<{ termId?: string }>;
}

export default async function QuarterlyReportDetailPage({
  params,
  searchParams,
}: IQuarterlyReportPageProps) {
  const { kidId } = await params;
  const { termId } = await searchParams;

  if (!termId) {
    return (
      <div className="p-4 text-center text-destructive">
        Parameter termId diperlukan
      </div>
    );
  }

  // Get kid info
  const kidData = await db.query.kid.findFirst({
    where: eq(kid.id, kidId),
    columns: { id: true, name: true },
  });

  if (!kidData) {
    return (
      <div className="p-4 text-center text-destructive">
        Murid tidak ditemukan
      </div>
    );
  }

  // Get term info
  const termData = await db.query.term.findFirst({
    where: eq(term.id, termId),
    columns: { id: true, name: true, startDate: true, endDate: true },
  });

  if (!termData) {
    return (
      <div className="p-4 text-center text-destructive">
        Term tidak ditemukan
      </div>
    );
  }

  // Get existing report
  const existingReportResult = await getQuarterlyReport(kidId, termId);
  const existingReport = existingReportResult.success
    ? existingReportResult.data
    : null;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/owner/reports/quarterly"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Kembali
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Laporan Triwulanan — {kidData.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {termData.name} ({termData.startDate} — {termData.endDate})
        </p>
      </div>

      {/* Client component for interactive report generation/editing */}
      <QuarterlyReportClient
        kidId={kidId}
        termId={termId}
        kidName={kidData.name}
        termName={termData.name}
        termStartDate={termData.startDate}
        termEndDate={termData.endDate}
        initialReport={existingReport}
      />
    </div>
  );
}
