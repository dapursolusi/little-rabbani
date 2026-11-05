import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import z from 'zod';

import { parseInput } from '@/lib/actions/parse-input';
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
      month,
    })
  ).map((dcr) => dcr.id);

  const monthlyReport = await kidReportRepo.findMonthlyReport({
    kidId,
    termId,
    month,
    dcrIds: dcrIdsByMonth,
  });
  return monthlyReport;
}
