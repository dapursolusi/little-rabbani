'use server';

import z from 'zod';

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

export async function saveReportNarrative(input: unknown) {
  const actionName = saveReportNarrative.name;

  const parsed = parseInput({
    input,
    schema: DailyKidReportSchema,
    fallbackError: `${actionName}: Input tidak lolos validasi`,
    withError: true,
  });
  if (!parsed.success) return parsed;
  return dailyKidReportService.saveReportNarrative(parsed.data);
}

export async function markReportAsSent(input: unknown) {
  const parsed = parseInput({
    input,
    schema: z.object({ dcrObservationId: uuidSchema }),
    fallbackError: 'ID Laporan harian tidak valid',
  });
  if (!parsed.success) return parsed;
  return dailyKidReportService.markReportAsSent({
    dcrObservationId: parsed.data.dcrObservationId,
  });
}
