'use server';

import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { term } from '@/lib/db/schema';

import { requireOwner } from './utils';

export async function getTerms() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const terms = await db.query.term.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return { success: true as const, data: terms };
}

export async function getTerm(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const result = await db.query.term.findFirst({
    where: eq(term.id, id),
  });

  if (!result) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  return { success: true as const, data: result };
}
