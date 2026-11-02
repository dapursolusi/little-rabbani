import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as termService from '@/features/term/services';
import z from 'zod';

import { parseInput } from '@/lib/actions/parse-input';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import { MonthlyKidReportParams } from '../types';

// Read

export async function getMonthlyAcademicDetails(input: MonthlyKidReportParams) {
  // 1. Input validation
  const parsed = parseInput({
    input,
    schema: z.object({
      kidId: uuidSchema,
      termId: uuidSchema,
      month: isoYearMonthSchema,
    }),
  });
  if (!parsed.success) return parsed;
  const { kidId, termId, month: yearMonth } = parsed.data;

  // 2. Validate batch and class session & load required data
  const classSessionId =
    await kidEnrollmentService.getKidClassSessionIdByTermId({
      termId,
      kidId,
    });
  if (!classSessionId)
    return {
      success: false as const,
      message:
        'Tidak ada data registrasi anak untuk batch saat ini. Pilih batch lain atau periksa registrasi anak',
    };
  const terms = await termService.getTerms();
  const dcrs = await dcrService.getDcrsByMonth({
    classSessionId,
    month: yearMonth,
  });

  return {
    success: true as const,
    data: { dcrs },
  };
}

export async function aggregateMonthlyReportData(input: {
  kidId: string;
  termId: string;
  month: string;
}) {}
