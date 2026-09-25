'use server';

import { parseInput } from '@/lib/actions/parse-input';

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
