import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import * as monthlyReportService from '@/features/report/month/services';
import z from 'zod';

import { parseInput } from '@/lib/action/parse-input';
import { AppError } from '@/lib/errors';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

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

  return aiDraft;
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
