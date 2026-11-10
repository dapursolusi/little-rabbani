import { redirect } from 'next/navigation';

import KidReportClient from '@/features/report/kid/components/client';
import * as kidReportService from '@/features/report/kid/services';

import { EmptyState } from '@/components/empty-state';

import {
  KidNoEligibleMonthsError,
  KidNoReportHistoryError,
} from '@/lib/errors';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Laporan Bulanan Anak' };

// Server Actions inherit this page's function budget. Generation bounds the
// provider call at 90s; 120s leaves room for the DB reads and the write.
// Keep in sync with `PROVIDER_TIMEOUT_MS` in features/report/kid/ai/generate.
export const maxDuration = 120;

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
  const page = await kidReportService
    .getKidMonthlyReportPage({ kidId, yearMonth: month, termId })
    .catch((error: unknown) => {
      if (
        error instanceof KidNoEligibleMonthsError ||
        error instanceof KidNoReportHistoryError
      ) {
        return error;
      }
      throw error;
    });

  if (page instanceof KidNoEligibleMonthsError) {
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

  if (page instanceof KidNoReportHistoryError) {
    return (
      <EmptyState
        title="Belum ada riwayat laporan"
        description="Laporan bulanan tersedia setelah batch berjalan. Kembali lagi setelah bulan pertama batch dimulai."
      />
    );
  }

  const { selectedMonth, selectedTerm, monthTerms, isFinalMonth } = page;

  // Canonicalise the URL so the client always navigates against resolved state.
  if (month !== selectedMonth || termId !== selectedTerm.id) {
    redirect(
      `/dashboard/report/kid/${kidId}?termId=${selectedTerm.id}&month=${selectedMonth}`
    );
  }

  const existingReport = page.kidDetails?.monthlyReports?.[0];

  return (
    <div>
      <KidReportClient
        key={`${kidId}-${selectedTerm.id}-${selectedMonth}`}
        currentKidId={kidId}
        currentTermId={selectedTerm.id}
        currentMonth={selectedMonth}
        prevMonth={page.prevMonth}
        nextMonth={page.nextMonth}
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
        kidDetails={page.kidDetails}
        academicDetails={page.academicDetails}
      />
    </div>
  );
}
