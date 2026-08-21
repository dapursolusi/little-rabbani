'use server';

import { db } from '@/db';
import { term } from '@/db/schema';
import { and, eq, gt, gte, isNull, lt, lte } from 'drizzle-orm';

import { parseInput } from '@/lib/actions/parse-input';
import { requireOwner } from '@/lib/actions/require-owner';

import { TermSchema } from './schema';

const INDONESIAN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function toRoman(n: number): string {
  const numerals: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  for (const [value, symbol] of numerals) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

function formatTermName(
  startDate: string,
  endDate: string,
  seq: number
): string {
  const year = startDate.split('-')[0];
  const month = (d: string) => INDONESIAN_MONTHS[Number(d.split('-')[1]) - 1];
  return `Batch ${toRoman(seq)} ${year} (${month(startDate)} - ${month(endDate)})`;
}

export async function checkCurrentTerm() {
  const today = new Date().toISOString().split('T')[0];

  const currentTerm = await db.query.term.findFirst({
    where: and(
      isNull(term.deletedAt),
      lte(term.startDate, today),
      gte(term.endDate, today)
    ),
  });
  if (currentTerm) {
    return { success: true as const, data: currentTerm };
  }

  const terms = await db.query.term.findMany({
    where: isNull(term.deletedAt),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  const latestTerm = terms[0];

  // Only auto-create when the latest batch has actually ended — never on top
  // of a future-dated one. Otherwise hand back whatever we have.
  if (latestTerm && !(latestTerm.endDate < today)) {
    return { success: true as const, data: latestTerm };
  }

  try {
    const startDate = today;
    const base = new Date(today).getTime();
    const endDate = latestTerm
      ? new Date(
          base +
            new Date(latestTerm.endDate).getTime() -
            new Date(latestTerm.startDate).getTime()
        )
          .toISOString()
          .split('T')[0]
      : new Date(base + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [insertedTerm] = await db
      .insert(term)
      .values({
        name: formatTermName(startDate, endDate, terms.length + 1),
        startDate,
        endDate,
      })
      .returning();

    return { success: true as const, data: insertedTerm };
  } catch (error) {
    console.error('checkCurrentTerm', error);
    return { success: false as const, error: 'Gagal membuat batch baru' };
  }
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
