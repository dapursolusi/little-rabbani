import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import { ActionResult } from '@/types';
import z from 'zod';

import { parseInput } from '@/lib/actions/parse-input';
import { logger } from '@/lib/logger';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import * as kidReportRepo from './repositories';
import { MonthlyKidReportDetail } from './types';

// Read

export async function getKidMonthlyReport({
  kidId,
  termId,
  month,
}: {
  kidId: string;
  termId: string;
  month: string;
}): Promise<ActionResult<MonthlyKidReportDetail>> {
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
    const enrollment = await kidEnrollmentService.verifyKidEnrollment({
      termId,
      kidId,
    });
    const isEnrolled = !!enrollment;

    if (!kid || !isEnrolled)
      return {
        success: false as const,
        message: 'Data anak tidak ditemukan',
      };

    const dcrIdsByMonth = (
      await dcrService.getDcrsByMonth({
        classSessionId: enrollment.classSessionId,
        month,
      })
    ).map((dcr) => dcr.id);

    const monthlyReport = await kidReportRepo.findMonthlyReport({
      kidId,
      termId,
      month,
      dcrIds: dcrIdsByMonth,
    });
    return {
      success: true as const,
      data: monthlyReport,
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
