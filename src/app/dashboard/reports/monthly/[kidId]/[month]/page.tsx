import Link from 'next/link';

import { db } from '@/db';
import { kid } from '@/db/schema';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { eq } from 'drizzle-orm';

import {
  getActiveTerm,
  getMonthlyReportForKidMonth,
} from '@/lib/actions/monthly-report';
import { baseMetadata } from '@/lib/metadata';

import { MonthlyReportClient } from './report-client';

export const metadata = { ...baseMetadata, title: 'Laporan Bulanan' };

function formatMonthLabel(value: string): string {
  const [yearStr, monthStr] = value.split('-').map(Number);
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return `${months[monthStr - 1] ?? ''} ${yearStr}`;
}

interface IMonthlyReportDetailPageProps {
  params: Promise<{ kidId: string; month: string }>;
}

export default async function MonthlyReportDetailPage({
  params,
}: IMonthlyReportDetailPageProps) {
  const { kidId, month } = await params;

  const termResult = await getActiveTerm();

  if (!termResult.success) {
    return (
      <div className="p-4 text-center text-destructive">{termResult.error}</div>
    );
  }

  const term = termResult.data;
  const existingReportResult = await getMonthlyReportForKidMonth(kidId, month);

  const existingReport = existingReportResult.success
    ? existingReportResult.data
    : null;

  // Get the kid name directly from DB if not available from report
  let kidName = existingReport?.kid?.name ?? '';
  if (!kidName) {
    const kidData = await db.query.kid.findFirst({
      where: eq(kid.id, kidId),
      columns: { name: true },
    });
    kidName = kidData?.name ?? '';
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/owner/reports/monthly"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Kembali
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Laporan Bulanan — {kidName || 'Memuat...'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatMonthLabel(month)} • {term.name}
        </p>
      </div>

      {/* Client component for interactive report generation/editing */}
      <MonthlyReportClient
        kidId={kidId}
        termId={term.id}
        month={month}
        kidName={kidName}
        initialReport={existingReport}
        termName={term.name}
      />
    </div>
  );
}
