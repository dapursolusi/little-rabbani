'use server';

import { db } from '@/db';
import { term } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';

import { parseInput } from '@/lib/actions/parse-input';
import { requireOwner } from '@/lib/actions/require-owner';

import { TermSchema } from './schema';
import * as termService from './services';

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
  const parsed = parseInput(TermSchema, input, 'Data batch tidak valid');
  if (!parsed.success) return parsed;
  const data = parsed.data;

  return await termService.createTerm(data);
}

export async function updateTerm(id: string, input: Record<string, unknown>) {
  const parsed = parseInput(TermSchema, input, 'Data batch tidak valid');
  if (!parsed.success) return parsed;
  const data = parsed.data;
  return await termService.updateTerm(id, data);
}

export async function deleteTerm(id: string) {
  return requireOwner(async () => {
    try {
      await db
        .update(term)
        .set({ deletedAt: new Date() })
        .where(eq(term.id, id));
      return { success: true as const, data: undefined };
    } catch (error) {
      console.error('deleteTerm', error);
      return { success: false as const, error: 'Gagal menghapus batch' };
    }
  });
}
