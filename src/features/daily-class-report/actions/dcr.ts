'use server';
import { ActionResult } from '@/types';

import { parseInput } from '@/lib/actions/parse-input';
import { uuidSchema } from '@/lib/validation/common';

import { dcrService } from '../services';

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
