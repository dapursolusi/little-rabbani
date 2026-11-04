'use server';

import { parseInput } from '@/lib/action/parse-input';
import { uuidSchema } from '@/lib/validation/common.schema';

import { dcrService } from '../services';
import { dailyClassReportSchema } from '../validation';

export async function getDCRs(input: {
  classSessionId?: string;
  date?: { year?: number; month?: number };
}) {
  return await dcrService.getDCRs(input);
}

export async function getOrCreateDCR({
  classSessionId,
}: {
  classSessionId: string;
}) {
  const parsed = parseInput({
    schema: uuidSchema,
    input: classSessionId,
    fallbackError: 'Data batch tidak valid',
  });
  if (!parsed.success) return parsed;
  return await dcrService.getOrCreateDCR({ classSessionId: parsed.data });
}

export async function saveDCR(input: unknown) {
  const parsed = parseInput({
    input,
    schema: dailyClassReportSchema,
    fallbackError: 'saveDCR: Validasi input gagal',
  });
  if (!parsed.success) throw new Error(parsed.message);
  return await dcrService.saveDCR(parsed.data);
}
