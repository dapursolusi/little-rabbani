'use server';
import { parseInput } from '@/lib/actions/parse-input';
import { uuidSchema } from '@/lib/validation/common.schema';

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
  const parsed = parseInput({
    input,
    schema: uuidSchema,
    fallbackError: 'Data batch tidak valid',
  });
  if (!parsed.success) return parsed;

  return await kidEnrollmentService.getCurrentTermKidEnrollmentsByClassSession(
    parsed.data
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
