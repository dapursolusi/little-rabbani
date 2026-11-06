'use server';

import * as kidReportService from '@/features/report/kid/services';
import { z } from 'zod';

import { handleActionError } from '@/lib/action/action-error';
import { parseInput } from '@/lib/action/parse-input';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import { MonthlyKidReportParams } from '../types';

const generateInputSchema = z.object({
  kidId: uuidSchema,
  termId: uuidSchema,
  yearMonth: isoYearMonthSchema,
});

const saveInputSchema = generateInputSchema.extend({
  narrative: z.string().min(1, 'Narasi tidak boleh kosong'),
});

export async function generateMonthlyReport(input: MonthlyKidReportParams) {
  try {
    const parsed = parseInput({ input, schema: generateInputSchema });
    if (!parsed.success) return parsed;

    const reportDraft = await kidReportService.generateMonthlyReport(
      parsed.data
    );
    return {
      success: true as const,
      data: reportDraft,
      message: 'Berhasil membuat laporan dengan AI',
    };
  } catch (error) {
    handleActionError(error);
  }
}

export async function saveMonthlyReportNarrative(
  input: MonthlyKidReportParams & { narrative: string }
) {
  try {
    const parsed = parseInput({ input, schema: saveInputSchema });
    if (!parsed.success) return parsed;

    const report = await kidReportService.saveMonthlyReportNarrative(
      parsed.data
    );
    return {
      success: true as const,
      data: report,
      message: 'Laporan berhasil disimpan',
    };
  } catch (error) {
    handleActionError(error);
  }
}
