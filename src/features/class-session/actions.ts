'use server';

import { parseInput } from '@/lib/actions/parse-input';

import { ClassSessionSchema, OverlappingClassSessionSchema } from './schema';
import * as classSessionService from './services';

export async function checkOverlappingClassSession(input: unknown) {
  const parsed = parseInput(
    OverlappingClassSessionSchema,
    input,
    'Data batch tidak valid'
  );
  if (!parsed.success) return parsed;
  const { startTime, endTime } = parsed.data;
  return await classSessionService.checkOverlappingClassSession({
    startTime,
    endTime,
  });
}

export async function createClassSession(input: unknown) {
  const parsed = parseInput(
    ClassSessionSchema,
    input,
    'Data batch tidak valid'
  );
  if (!parsed.success) return parsed;
  const data = parsed.data;
  return await classSessionService.createClassSession(data);
}

export async function updateClassSession(
  id: string,
  input: Record<string, unknown>
) {
  const parsed = parseInput(
    ClassSessionSchema,
    input,
    'Data batch tidak valid'
  );
  if (!parsed.success) return parsed;
  const data = parsed.data;
  return await classSessionService.updateClassSession(id, data);
}

export async function getClassSessions() {
  return classSessionService.getClassSessions();
}

export async function deleteClassSession(id: string) {
  return await classSessionService.deleteClassSession(id);
}
