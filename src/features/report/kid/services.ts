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
  ReportAlreadyExistsError,
  ReportAlreadySentError,
  ReportEmptyError,
  ReportNotFoundError,
  ReportNotReviewedError,
} from '@/lib/errors';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import { MONTHLY_REPORT_STATUS, MonthlyReportStatus } from '../constants';
import { MonthlyKidReportParams } from '../types';
import { generateMonthlyReportDraft } from './ai/generate';
import * as kidReportRepo from './repositories';

type MonthlyReportRow = NonNullable<
  Awaited<ReturnType<typeof kidReportRepo.findMonthlyReportRow>>
>;

// ============================================
// SERVER ACTION USE CASES
// ============================================

export async function generateMonthlyReport(input: MonthlyKidReportParams) {
  // Future month, stale termId, or a term-final month (termly reporting
  // territory) must never reach generation.
  await assertReportableMonth(input);

  // Generate and format the replacement BEFORE touching persisted content —
  // a provider failure leaves the existing report exactly as it was.
  const { narrative, aiDraft } = await generateNarrative(input);

  // Sent reports are immutable. Checked here for a useful message; the repo
  // upsert also refuses to touch a sent row.
  const existing = await kidReportRepo.findMonthlyReportRow(input);
  if (existing?.reportStatus === MONTHLY_REPORT_STATUS.SENT) {
    throw new ReportAlreadySentError();
  }

  // Upsert: first generation inserts, regeneration replaces. One statement
  // avoids a find-then-insert race, and resetting the lifecycle here is what
  // makes "successful regeneration returns the report to draft" true.
  const report = await kidReportRepo.createMonthlyReport({
    ...input,
    narrative,
  });
  // The repo upsert refuses sent rows, so an empty result after a non-sent
  // read means the report was sent concurrently — report it as such.
  if (!report) throw new ReportAlreadySentError();

  return { narrative, aiDraft };
}

/**
 * Batch generation entry point: create a report only when none exists.
 * Same pipeline as `generateMonthlyReport` (eligibility → AI → format), but
 * insert-only persistence — an existing row, even one written concurrently
 * between the read and the LLM call, is never regenerated or overwritten.
 */
export async function generateMonthlyReportIfMissing(
  input: MonthlyKidReportParams
) {
  await assertReportableMonth(input);

  const existing = await kidReportRepo.findMonthlyReportRow(input);
  if (existing) throw new ReportAlreadyExistsError();

  const { narrative, aiDraft } = await generateNarrative(input);

  const report = await kidReportRepo.insertMonthlyReportIfMissing({
    ...input,
    narrative,
  });
  // The insert is conflict-safe: an empty result means a concurrent request
  // won the slot, so report it as an existing report.
  if (!report) throw new ReportAlreadyExistsError();

  return { narrative, aiDraft };
}

export async function saveMonthlyReportNarrative({
  kidId,
  termId,
  yearMonth,
  narrative,
}: MonthlyKidReportParams & { narrative: string }) {
  await assertReportableMonth({ kidId, termId, yearMonth });

  // No row yet: the user wrote the first draft manually (no AI generation).
  // Same upsert path as generation, flagged as a manual edit.
  const existing = await kidReportRepo.findMonthlyReportRow({
    kidId,
    termId,
    yearMonth,
  });
  if (!existing) {
    const created = await kidReportRepo.createMonthlyReport({
      kidId,
      termId,
      yearMonth,
      narrative,
      isEdited: true,
    });
    if (!created) throw new ReportAlreadySentError();

    return created;
  }
  assertNotSent(existing);

  // Saving unchanged content is a no-op — it must not flag manual edits or
  // invalidate a review.
  if (existing.narrative === narrative) return existing;

  const updated = await kidReportRepo.updateMonthlyReport({
    reportId: existing.id,
    values: {
      narrative,
      isEdited: true,
      // Editing invalidates a prior review: back to draft for re-review.
      reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
      reviewedAt: null,
    },
  });
  if (!updated) throw new ReportNotFoundError();

  return updated;
}

export async function markMonthlyReportReviewed({
  kidId,
  termId,
  yearMonth,
}: MonthlyKidReportParams) {
  await assertReportableMonth({ kidId, termId, yearMonth });

  const existing = await assertMutableReport({ kidId, termId, yearMonth });
  if (!existing.narrative?.trim()) throw new ReportEmptyError();

  const updated = await kidReportRepo.updateMonthlyReport({
    reportId: existing.id,
    values: {
      reportStatus: MONTHLY_REPORT_STATUS.REVIEWED,
      reviewedAt: new Date(),
    },
  });
  if (!updated) throw new ReportNotFoundError();

  return updated;
}

export async function markMonthlyReportSent({
  kidId,
  termId,
  yearMonth,
  sentBy,
}: MonthlyKidReportParams & { sentBy: string }) {
  await assertReportableMonth({ kidId, termId, yearMonth });

  const existing = await assertMutableReport({ kidId, termId, yearMonth });
  if (existing.reportStatus !== MONTHLY_REPORT_STATUS.REVIEWED) {
    throw new ReportNotReviewedError();
  }

  const updated = await kidReportRepo.updateMonthlyReport({
    reportId: existing.id,
    values: {
      reportStatus: MONTHLY_REPORT_STATUS.SENT,
      sentAt: new Date(),
      sentBy,
    },
  });
  if (!updated) throw new ReportNotFoundError();

  return updated;
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

/** Shared AI pipeline: aggregate evidence → provider call → formatted text. */
async function generateNarrative(input: MonthlyKidReportParams) {
  const kidContext =
    await monthlyReportService.aggregateMonthlyKidReportData(input);

  const aiDraft = await generateMonthlyReportDraft(kidContext);
  if (!aiDraft) {
    throw new AppError(
      'Failed to generate text from LLM',
      'Gagal membuat draft'
    );
  }

  return { narrative: formatDraft(aiDraft), aiDraft };
}

/** Shared guard: the month must have started and must be reportable. */
async function assertReportableMonth({
  kidId,
  termId,
  yearMonth,
}: MonthlyKidReportParams) {
  if (!hasMonthStarted(yearMonth)) throw new FutureMonthReportError();

  const range = await monthlyReportService.resolveReportRange({
    kidId,
    termId,
    yearMonth,
  });
  if (!range) throw new KidNotEnrolledError();
  if (range.isFinalMonth) throw new FinalMonthUsesTermlyReportError();
}

/** Sent reports are immutable — one guard shape for every caller. */
function assertNotSent(existing: MonthlyReportRow) {
  if (existing.reportStatus === MONTHLY_REPORT_STATUS.SENT) {
    throw new ReportAlreadySentError();
  }
}

/** Load a report row that may be changed: it must exist and not be sent. */
async function assertMutableReport({
  kidId,
  termId,
  yearMonth,
}: MonthlyKidReportParams): Promise<MonthlyReportRow> {
  const existing = await kidReportRepo.findMonthlyReportRow({
    kidId,
    termId,
    yearMonth,
  });
  if (!existing) throw new ReportNotFoundError();
  assertNotSent(existing);

  return existing;
}

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

// Re-export for the client component's status badge typing.
export type { MonthlyReportStatus };
