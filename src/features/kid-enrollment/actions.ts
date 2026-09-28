'use server';
import { parseInput } from '@/lib/actions/parse-input';
import { uuidSchema } from '@/lib/validation/common';

import * as kidEnrollmentService from './services';
import { KidEnrollmentSchema, SaveEnrollmentChangesSchema } from './validation';

export async function getKidsEnrollments(input?: unknown) {
  return await kidEnrollmentService.getKidsEnrollments(
    input as { termId?: string; classSessionId?: string }
  );
}

export async function getCurrentTermKidEnrollmentsByClassSession(
  input: unknown
) {
  console.log('input: ', input);
  const parsed = parseInput({
    input,
    schema: uuidSchema,
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
  const classSessionId = parsed.data;
  return await kidEnrollmentService.getCurrentTermKidEnrollmentsByClassSession(
    classSessionId
  );
}

export async function getAvailableKids(input: unknown) {
  return await kidEnrollmentService.getAvailableKids(
    input as { termId: string; classSessionId: string }
  );
}

export async function createKidsEnrollments(input: unknown) {
  const parsed = parseInput({
    input,
    schema: KidEnrollmentSchema,
  });
  if (!parsed.success) return parsed;
  return await kidEnrollmentService.createKidsEnrollments(parsed.data);
}

export async function saveEnrollmentChanges(input: unknown) {
  const parsed = parseInput({
    input,
    schema: SaveEnrollmentChangesSchema,
  });
  if (!parsed.success) return parsed;
  return await kidEnrollmentService.saveEnrollmentChanges(parsed.data);
}
