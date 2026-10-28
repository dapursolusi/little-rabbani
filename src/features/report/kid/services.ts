import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import z from 'zod';

import { parseInput } from '@/lib/actions/parse-input';
import { logger } from '@/lib/logger';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import * as kidReportRepo from './repositories';

// Read

export async function getKidMonthlyReport({
  kidId,
  termId,
  month,
}: {
  kidId: string;
  termId: string;
  month: string;
}) {
  try {
    // 1. Input validation
    const parsed = parseInput({
      input: { kidId, termId, month },
      schema: z.object({
        kidId: uuidSchema,
        termId: uuidSchema,
        month: isoYearMonthSchema,
      }),
      fallbackError: 'Invalid search params format',
    });
    if (!parsed.success) return parsed;

    // 2. Validate kid and report then load required data
    const kid = await kidService.getKidBasicInfo(kidId);
    const isEnrolled = (
      await kidEnrollmentService.verifyKidEnrollment({ termId, kidId })
    ).success;

    const kidData = await kidReportRepo.findMonthlyReport({
      kidId,
      termId,
      month,
    });
    if (!kid || !isEnrolled || !kidData)
      return {
        success: false as const,
        message: 'Data anak tidak ditemukan',
      };
    return {
      success: true as const,
      data: kidData,
    };
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      'getKidMonthlyReport'
    );
    return {
      success: false as const,
      message: 'Gagal memuat data laporan bulanan anak',
    };
  }
}
