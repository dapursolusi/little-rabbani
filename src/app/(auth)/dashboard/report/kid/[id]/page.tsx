import { redirect } from 'next/navigation';

import KidReportClient from '@/features/report/kid/components/client';
import * as kidReportService from '@/features/report/kid/services';
import * as monthlyReportService from '@/features/report/month/services';

import { EmptyState } from '@/components/shared/empty-state';

import {
  KidNoEligibleMonthsError,
  KidNoReportHistoryError,
} from '@/lib/errors';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Bulanan Anak' };

export default async function KidReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ termId?: string; month?: string }>;
}) {
  const { id: kidId } = await params;
  const { termId, month } = await searchParams;

  // Reportable months come from the kid's enrollments, filtered to months that
  // have already started. An ineligible or future month falls back to the
  // latest reportable one.
  const context = await kidReportService
    .getKidMonthlyReportContext({ kidId, yearMonth: month, termId })
    .catch((error: unknown) => {
      if (
        error instanceof KidNoEligibleMonthsError ||
        error instanceof KidNoReportHistoryError
      ) {
        return error;
      }
      throw error;
    });

  if (context instanceof KidNoEligibleMonthsError) {
    return (
      <EmptyState
        title="Belum ada batch"
        description="Anak ini belum terdaftar di batch mana pun, sehingga belum ada laporan bulanan yang bisa dibuat."
        action={{
          type: 'href',
          label: 'Daftarkan anak',
          href: '/dashboard/registration',
        }}
      />
    );
  }

  if (context instanceof KidNoReportHistoryError) {
    return (
      <EmptyState
        title="Belum ada riwayat laporan"
        description="Laporan bulanan tersedia setelah batch berjalan. Kembali lagi setelah bulan pertama batch dimulai."
      />
    );
  }

  const { selectedMonth, selectedTerm, monthTerms, isFinalMonth } = context;

  // Canonicalise the URL so the client always navigates against resolved state.
  if (month !== selectedMonth || termId !== selectedTerm.id) {
    redirect(
      `/dashboard/report/kid/${kidId}?termId=${selectedTerm.id}&month=${selectedMonth}`
    );
  }

  const [kidDetails, academicDetailsResult] = await Promise.all([
    kidReportService.getKidMonthlyReport({
      termId: selectedTerm.id,
      kidId,
      yearMonth: selectedMonth,
    }),
    monthlyReportService.getMonthlyAcademicDetails({
      kidId,
      termId: selectedTerm.id,
      yearMonth: selectedMonth,
    }),
  ]);

  const existingReport = kidDetails?.monthlyReports?.[0];

  return (
    <div>
      <KidReportClient
        key={`${kidId}-${selectedTerm.id}-${selectedMonth}`}
        currentKidId={kidId}
        currentTermId={selectedTerm.id}
        currentMonth={selectedMonth}
        prevMonth={context.prevMonth}
        nextMonth={context.nextMonth}
        terms={monthTerms}
        isFinalMonth={isFinalMonth}
        initialReport={
          existingReport?.reportStatus
            ? {
                id: existingReport.id,
                narrative: existingReport.narrative,
                reportStatus: existingReport.reportStatus,
                isEdited: existingReport.isEdited,
                sentAt: existingReport.sentAt,
              }
            : null
        }
        kidDetails={kidDetails}
        academicDetails={academicDetailsResult.data}
      />
    </div>
  );
}
