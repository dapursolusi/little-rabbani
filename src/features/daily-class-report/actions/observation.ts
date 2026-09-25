'use server';

import { parseInput } from '@/lib/actions/parse-input';
import { uuidSchema } from '@/lib/validation/common';

import { observationService } from '../services';
import { dcrObservationSchema } from '../validation';

export async function createKidObservation({
  input,
  classSessionId,
}: {
  input: unknown;
  classSessionId: string;
}) {
  const parsed = parseInput({
    input,
    schema: dcrObservationSchema,
  });
  if (!parsed.success) return parsed;
  return await observationService.createKidObservation({
    input: parsed.data,
    classSessionId,
  });
}

export async function getDCRObservationsByDcrId(input: string) {
  const parsed = parseInput({
    schema: uuidSchema,
    input,
    fallbackError: 'Data batch tidak valid',
  });
  if (!parsed.success)
    return {
      success: false as const,
      error: {
        type: ['ACTION_VALIDATION'],
      },
      message: 'Tipe ID sesi kelas tidak valid',
    };
  return await observationService.getDCRObservationsByDcrId(parsed.data);
}
