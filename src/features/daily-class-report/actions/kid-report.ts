'use server';

import { ActionResult } from '@/types';

import { parseInput } from '@/lib/actions/parse-input';
import { uuidSchema } from '@/lib/validation/common';

import { dailyKidReportService } from '../services';
import { GeneratedReport } from '../services/kid-report';

export async function generateDailyKidReportsByDcrId(input: unknown) {
  const parsed = parseInput({
    input,
    schema: uuidSchema,
    fallbackError: 'ID Laporan harian tidak valid.',
  });
  if (!parsed.success) {
    return { success: false as const, message: parsed.error } as ActionResult<
      GeneratedReport[]
    >;
  }
  return await dailyKidReportService.generateDailyKidReportsByDcrId(
    parsed.data
  );
}

export async function getDailyKidReportsByDcrId(input: unknown) {
  const parsed = parseInput({
    input,
    schema: uuidSchema,
    fallbackError: 'ID Laporan harian tidak valid.',
  });
  if (!parsed.success) {
    return { success: false as const, message: parsed.error } as ActionResult<
      GeneratedReport[]
    >;
  }
  return await dailyKidReportService.getDailyKidReportsByDcrId(parsed.data);
}
