import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import * as monthlyReportService from '@/features/report/month/services';
import { formatDraft } from '@/features/report/utils';
import z from 'zod';

import { parseInput } from '@/lib/action/parse-input';
import {
  AppError,
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
  const enrollment = await kidEnrollmentService.verifyKidEnrollment({
    termId,
    kidId,
  });
  const isEnrolled = !!enrollment;

  if (!kid || !isEnrolled) throw new Error('Data anak tidak ditemukan');

  const dcrIdsByMonth = (
    await dcrService.getDcrsByMonth({
      classSessionId: enrollment.classSessionId,
      yearMonth,
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

export async function findMonthlyReportRow({
  kidId,
  termId,
  yearMonth,
}: MonthlyKidReportParams) {
  return kidReportRepo.findMonthlyReportRow({ kidId, termId, yearMonth });
}

// Re-export for the client component's status badge typing.
export type { MonthlyReportStatus };
