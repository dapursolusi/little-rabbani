'use server';

import { parseInput } from '@/lib/actions/parse-input';
import { uuidSchema } from '@/lib/validation/common';

import { dailyKidReportService } from '../services';
import { DailyKidReportSchema } from '../validation';

export async function generateDailyKidReportsByDcrId(input: unknown) {
  const parsed = parseInput({
    input,
    schema: uuidSchema,
    fallbackError: 'ID Laporan harian tidak valid.',
  });
  if (!parsed.success) return parsed;
  return dailyKidReportService.generateDailyKidReportsByDcrId(parsed.data);
}

export async function getDailyKidReportsByDcrId(input: unknown) {
  const parsed = parseInput({
    input,
    schema: uuidSchema,
    fallbackError: 'ID Laporan harian tidak valid.',
  });
  if (!parsed.success) return parsed;
  return dailyKidReportService.getDailyKidReportsByDcrId(parsed.data);
}

export async function saveReportNarration(input: unknown) {
  const actionName = saveReportNarration.name;

  const parsed = parseInput({
    input,
    schema: DailyKidReportSchema,
    fallbackError: `${actionName}: Input tidak lolos validasi`,
    withError: true,
  });
  if (!parsed.success) return parsed;
  return dailyKidReportService.saveReportNarration(parsed.data);
}
