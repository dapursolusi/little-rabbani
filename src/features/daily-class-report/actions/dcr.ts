'use server';
import { ActionResult } from '@/types';
import z from 'zod';

import { parseInput } from '@/lib/actions/parse-input';
import { uuidSchema } from '@/lib/validation/common';

import { dcrService } from '../services';
import { DailyClassReport } from '../types';
import { dailyClassReportSchema } from '../validation';

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
  if (!parsed.success)
    return {
      success: false as const,
      error: {
        type: ['ACTION_VALIDATION'],
      },
      message: 'Tipe ID sesi kelas tidak valid',
    } as ActionResult<{ id: string }>;
  return await dcrService.getOrCreateDCR({ classSessionId: parsed.data });
}

export async function getDCRs(input: unknown = {}) {
  const parsed = parseInput({
    input,
    schema: z.object({
      classSessionId: z.uuid().optional(),
      date: z
        .object({
          year: z.number().int().min(2025).max(2100).optional(),
          month: z.number().int().min(1).max(12).optional(),
        })
        .optional(),
    }),
    fallbackError: 'getDCRs: Opsi input tidak valid',
  });
  if (!parsed.success) {
    return {
      success: false as const,
      error: {
        type: ['ACTION_VALIDATION'],
      },
      message: parsed.error,
    } as ActionResult<DailyClassReport[]>;
  }
  return await dcrService.getDCRs(parsed.data);
}

export async function saveDCR(input: unknown) {
  const parsed = parseInput({
    input,
    schema: dailyClassReportSchema,
    fallbackError: 'saveDCR: Validasi input gagal',
  });
  if (!parsed.success)
    return {
      success: false as const,
      error: { type: ['ACTION_VALIDATION'] },
      message: parsed.error,
    };
  return await dcrService.saveDCR(parsed.data);
}
