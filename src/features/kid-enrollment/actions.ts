'use server';
import { parseInput } from '@/lib/actions/parse-input';

import { KidEnrollmentSchema } from './schema';
import * as kidEnrollmentService from './services';

export async function getKidsEnrollments(input?: unknown) {
  return await kidEnrollmentService.getKidsEnrollments(
    input as { termId?: string; classSessionId?: string }
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
