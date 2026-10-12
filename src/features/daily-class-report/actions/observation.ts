'use server';

import z from 'zod';

import { parseInput } from '@/lib/actions/parse-input';
import { isoDateSchema, uuidSchema } from '@/lib/validation/common';

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

export async function updateKidObservation(input: unknown) {
  const parsed = parseInput({
    input,
    schema: dcrObservationSchema,
    fallbackError: 'Data observasi kelas tidak valid',
  });
  if (!parsed.success) return parsed;
  return await observationService.updateKidObservation(parsed.data);
}

export async function getDCRObservationsByDcrId(input: unknown) {
  const parsed = parseInput({
    schema: uuidSchema,
    input,
    fallbackError: 'Data input (id) tidak valid',
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

export async function getDCRObservationsByDate(
  dateInput: unknown,
  optsInput: unknown
) {
  const parsedDate = parseInput({
    schema: isoDateSchema,
    input: dateInput,
    fallbackError: 'Data input (tanggal) tidak valid',
  });
  if (!parsedDate.success) return parsedDate;
  const date = parsedDate.data;

  const parsedOpts = parseInput({
    schema: z.object({
      classSessionId: z.string().optional(),
    }),
    input: optsInput,
    fallbackError: 'Data input (opsi) tidak valid',
  });
  if (!parsedOpts.success) return parsedOpts;
  const { classSessionId } = parsedOpts.data;
  return await observationService.getDCRObservationsByDate(date, {
    classSessionId,
  });
}
