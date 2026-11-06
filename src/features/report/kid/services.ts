import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import * as monthlyReportService from '@/features/report/month/services';
import { formatDraft } from '@/features/report/utils';
import {
  buildEligibleMonths,
  buildReportableMonths,
  hasMonthStarted,
  isTermFinalMonth,
  resolveTermForMonth,
  termsOverlappingMonth,
} from '@/features/report/utils';
import z from 'zod';

import { parseInput } from '@/lib/action/parse-input';
import {
  AppError,
  FinalMonthUsesTermlyReportError,
  FutureMonthReportError,
  KidNoEligibleMonthsError,
  KidNoReportHistoryError,
  KidNotEnrolledError,
  ReportAlreadySentError,
  ReportNotFoundError,
} from '@/lib/errors';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import { MONTHLY_REPORT_STATUS, MonthlyReportStatus } from '../constants';
import { MonthlyKidReportParams } from '../types';
import { generateMonthlyReportDraft } from './ai/generate';
import * as kidReportRepo from './repositories';

// ============================================
// SERVER ACTION USE CASES
// ============================================

export async function generateMonthlyReport(input: MonthlyKidReportParams) {
  // A month that has not started has no data to report on.
  if (!hasMonthStarted(input.yearMonth)) throw new FutureMonthReportError();

  // Final month of a term is termly-report territory — never generate or
  // persist a monthly narrative there, no matter what the client sends.
  const range = await monthlyReportService.resolveReportRange(input);
  // Stale termId / ineligible month must never reach generation.
  if (!range) throw new KidNotEnrolledError();
  if (range.isFinalMonth) {
    throw new FinalMonthUsesTermlyReportError();
  }

  const kidContext =
    await monthlyReportService.aggregateMonthlyKidReportData(input);

  const aiDraft = await generateMonthlyReportDraft(kidContext);
  if (!aiDraft) {
    throw new AppError(
      'Failed to generate text from LLM',
      'Gagal membuat draft'
    );
  }

  const narrative = formatDraft(aiDraft);

  // Guard sent reports, then upsert: first generation inserts, regeneration
  // overwrites. Single upsert avoids a find-then-insert race.
  const existing = await kidReportRepo.findMonthlyReportRow(input);
  if (existing?.reportStatus === MONTHLY_REPORT_STATUS.SENT) {
    throw new ReportAlreadySentError();
  }
  const report = await kidReportRepo.createMonthlyReport({
    ...input,
    narrative,
  });
  if (!report)
    throw new AppError('Report upsert failed', 'Gagal menyimpan draft');

  return { narrative, aiDraft };
}

export async function saveMonthlyReportNarrative({
  kidId,
  termId,
  yearMonth,
  narrative,
}: MonthlyKidReportParams & { narrative: string }) {
  if (!hasMonthStarted(yearMonth)) throw new FutureMonthReportError();

  const range = await monthlyReportService.resolveReportRange({
    kidId,
    termId,
    yearMonth,
  });
  // Stale termId / ineligible month must never reach persistence.
  if (!range) throw new KidNotEnrolledError();
  if (range.isFinalMonth) {
    throw new FinalMonthUsesTermlyReportError();
  }

  const existing = await kidReportRepo.findMonthlyReportRow({
    kidId,
    termId,
    yearMonth,
  });
  if (!existing) throw new ReportNotFoundError();
  if (existing.reportStatus === MONTHLY_REPORT_STATUS.SENT) {
    throw new ReportAlreadySentError();
  }

  return kidReportRepo.updateMonthlyReportNarrative({
    reportId: existing.id,
    narrative,
    reportStatus: MONTHLY_REPORT_STATUS.EDITED,
  });
}

// ============================================
// SERVER COMPONENT QUERIES
// ============================================

// Read

export async function getKidMonthlyReport({
  kidId,
  termId,
  yearMonth,
}: MonthlyKidReportParams) {
  // 1. Input validation
  const parsed = parseInput({
    input: { kidId, termId, yearMonth },
    schema: z.object({
      kidId: uuidSchema,
      termId: uuidSchema,
      yearMonth: isoYearMonthSchema,
    }),
    fallbackError: 'Invalid search params format',
  });
  if (!parsed.success) throw new Error(parsed.message);

  // 2. Validate kid and report then load required data
  const kid = await kidService.getKidBasicInfo(kidId);
  const range = await monthlyReportService.resolveReportRange({
    kidId,
    termId,
    yearMonth,
  });

  if (!kid || !range) throw new Error('Data anak tidak ditemukan');

  const dcrIdsByMonth = (
    await dcrService.getDcrsByMonth({
      classSessionId: range.classSessionId,
      startDate: range.startDate,
      endDate: range.endDate,
    })
  ).map((dcr) => dcr.id);

  const monthlyReport = await kidReportRepo.findMonthlyReport({
    kidId,
    termId,
    yearMonth,
    dcrIds: dcrIdsByMonth,
  });
  return monthlyReport;
}

// ============================================
// INTERNAL OPERATIONS
// ============================================

/**
 * Resolve the report context for one kid + requested month + requested term.
 * Only enrolled months that have already started are reportable; a future or
 * ineligible month falls back to the latest reportable one. Within a month, an
 * eligible `termId` from the URL wins, then the ongoing term, then the greatest
 * overlap.
 */
export async function getKidMonthlyReportContext({
  kidId,
  yearMonth,
  termId,
}: {
  kidId: string;
  yearMonth?: string;
  termId?: string;
}) {
  const enrolledTerms = await kidEnrollmentService.getKidEnrolledTerms(kidId);
  if (buildEligibleMonths(enrolledTerms).length === 0) {
    throw new KidNoEligibleMonthsError();
  }

  const reportableMonths = buildReportableMonths(enrolledTerms);
  if (reportableMonths.length === 0) {
    throw new KidNoReportHistoryError();
  }

  const isReportable = (month: string) => reportableMonths.includes(month);
  const selectedMonth =
    yearMonth && isReportable(yearMonth)
      ? yearMonth
      : reportableMonths[reportableMonths.length - 1];

  const monthTerms = termsOverlappingMonth(enrolledTerms, selectedMonth);
  const selectedTerm = resolveTermForMonth({
    terms: monthTerms,
    yearMonth: selectedMonth,
    requestedTermId: termId,
  });
  if (!selectedTerm) {
    throw new KidNoReportHistoryError();
  }

  const selectedIndex = reportableMonths.indexOf(selectedMonth);
  const range = await monthlyReportService.resolveReportRange({
    kidId,
    termId: selectedTerm.id,
    yearMonth: selectedMonth,
  });

  return {
    enrolledTerms,
    reportableMonths,
    selectedMonth,
    selectedTerm,
    monthTerms,
    isFinalMonth:
      range?.isFinalMonth ?? isTermFinalMonth(selectedTerm, selectedMonth),
    prevMonth: reportableMonths[selectedIndex - 1] ?? null,
    nextMonth: reportableMonths[selectedIndex + 1] ?? null,
  };
}

export async function findMonthlyReportRow({
  kidId,
  termId,
  yearMonth,
}: MonthlyKidReportParams) {
  return kidReportRepo.findMonthlyReportRow({ kidId, termId, yearMonth });
}

// Re-export for the client component's status badge typing.
export type { MonthlyReportStatus };
