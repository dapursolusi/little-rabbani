'use server';

import { db } from '@/db';
import { term } from '@/db/schema';
import { isNull } from 'drizzle-orm';

import { parseInput } from '@/lib/actions/parse-input';
import { requireOwner } from '@/lib/actions/require-owner';

import * as termService from './services';
import { TermSchema } from './validation';

export async function checkCurrentTerm() {
  return await termService.checkCurrentTerm();
}

export async function checkNextTerm() {
  return await termService.checkNextTerm();
}

export async function getTerms() {
  return requireOwner(async () => {
    const terms = await db.query.term.findMany({
      where: isNull(term.deletedAt),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    return { success: true as const, data: terms };
  });
}

export async function createTerm(input: unknown) {
  const parsed = parseInput({
    schema: TermSchema,
    input,
    fallbackError: 'Data batch tidak valid',
  });
  if (!parsed.success) return parsed;
  const data = parsed.data;

  return await termService.createTerm(data);
}

export async function updateTerm(id: string, input: unknown) {
  const parsed = parseInput({
    schema: TermSchema,
    input,
    fallbackError: 'Data batch tidak valid',
  });
  if (!parsed.success) return parsed;
  const data = parsed.data;
  return await termService.updateTerm(id, data);
}

export async function deleteTerm(id: string) {
  return await termService.deleteTerm(id);
}
