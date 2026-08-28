'use server';

import { db } from '@/db';
import { term } from '@/db/schema';
import { and, eq, gt, isNull, lt, ne } from 'drizzle-orm';

import { parseInput } from '@/lib/actions/parse-input';
import { requireOwner } from '@/lib/actions/require-owner';

import { TermSchema } from './schema';
import * as termService from './services';

export async function checkCurrentTerm() {
  await termService.checkCurrentTerm();
}

export async function checkNextTerm() {
  await termService.checkNextTerm();
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

export async function createTerm(input: Record<string, unknown>) {
  return requireOwner(async () => {
    const parsed = parseInput(TermSchema, input, 'Data batch tidak valid');
    if (!parsed.success) return parsed;
    const data = parsed.data;

    try {
      const inputStartDate = new Date(data.startDate)
        .toISOString()
        .split('T')[0];
      const inputEndDate = new Date(data.endDate).toISOString().split('T')[0];
      const conflictingTerm = await db.query.term.findFirst({
        where: and(
          isNull(term.deletedAt),
          lt(term.startDate, inputEndDate),
          gt(term.endDate, inputStartDate)
        ),
      });

      if (conflictingTerm) {
        return {
          success: false as const,
          error:
            'Batch untuk tanggal tersebut bertabrakan dengan batch yang sudah ada. Silahkan pilih tanggal yang lain atau periksa lagi.',
        };
      }

      const [newTerm] = await db
        .insert(term)
        .values({
          name: data.name,
          startDate: inputStartDate,
          endDate: inputEndDate,
        })
        .returning();

      return { success: true as const, data: newTerm };
    } catch (error) {
      console.error('createTerm', error);
      return { success: false as const, error: 'Gagal menambahkan batch baru' };
    }
  });
}

export async function updateTerm(id: string, input: Record<string, unknown>) {
  return requireOwner(async () => {
    const parsed = parseInput(TermSchema, input, 'Data batch tidak valid');
    if (!parsed.success) return parsed;
    const data = parsed.data;

    try {
      const existing = await db.query.term.findFirst({
        where: eq(term.id, id),
      });
      if (!existing) {
        return { success: false as const, error: 'Batch tidak ditemukan' };
      }
      const oldEndDate = new Date(existing.endDate).toISOString().split('T')[0];

      await db
        .update(term)
        .set({
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          isAutoCreated: false,
        })
        .where(eq(term.id, id));

      // A date edit invalidates the auto-created successor that was chained
      // to this term's old end date — retire it so checkNextTerm regenerates
      // it from the corrected dates.
      const successor = await db.query.term.findFirst({
        where: and(
          isNull(term.deletedAt),
          ne(term.id, id),
          eq(term.isAutoCreated, true),
          eq(term.startDate, oldEndDate)
        ),
      });
      if (successor) {
        await db
          .update(term)
          .set({ deletedAt: new Date() })
          .where(eq(term.id, successor.id));
      }

      return { success: true as const, data: undefined };
    } catch (error) {
      console.error('updateTerm', error);
      return { success: false as const, error: 'Gagal memperbarui batch' };
    }
  });
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
