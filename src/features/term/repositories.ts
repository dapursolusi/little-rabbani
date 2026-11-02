import { db } from '@/db';
import { term } from '@/db/schema';
import { DbColumnSelection } from '@/types';
import { and, eq, gt, gte, isNull, lt, lte } from 'drizzle-orm';

import { TermData } from './types';
import { TermInput } from './validation';

// Constants

const termColumnSelection = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  isAutoCreated: true,
} as const satisfies DbColumnSelection<TermData>;

export async function findCurrent(todayStr: string) {
  return db.query.term.findFirst({
    where: and(
      isNull(term.deletedAt),
      lte(term.startDate, todayStr),
      gte(term.endDate, todayStr)
    ),
    columns: termColumnSelection,
  });
}

export async function findNext(todayStr: string) {
  return db.query.term.findFirst({
    where: and(isNull(term.deletedAt), gt(term.startDate, todayStr)),
    columns: termColumnSelection,
  });
}

export async function findMany() {
  return db.query.term.findMany({
    where: isNull(term.deletedAt),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

export async function findById(id: string) {
  return db.query.term.findFirst({
    where: and(isNull(term.deletedAt), eq(term.id, id)),
    columns: termColumnSelection,
  });
}

export async function insert({
  name,
  startDate,
  endDate,
  isAutoCreated,
}: {
  name: string;
  startDate: string;
  endDate: string;
  isAutoCreated?: boolean;
}) {
  const [inserted] = await db
    .insert(term)
    .values({
      name,
      startDate,
      endDate,
      isAutoCreated: isAutoCreated ?? false,
    })
    .returning();
  return inserted;
}

export async function update(id: string, input: TermInput) {
  const [updated] = await db
    .update(term)
    .set(input)
    .where(eq(term.id, id))
    .returning();
  return updated;
}

export async function remove(id: string) {
  const [deleted] = await db
    .update(term)
    .set({ deletedAt: new Date() })
    .where(eq(term.id, id))
    .returning();
  return deleted;
}

export async function findOverlapping(startDate: string, endDate: string) {
  return await db.query.term.findFirst({
    where: and(
      isNull(term.deletedAt),
      lt(term.startDate, endDate),
      gt(term.endDate, startDate)
    ),
  });
}

export async function deleteAutoCreatedSuccessor(startDate: string) {
  await db
    .update(term)
    .set({ deletedAt: new Date() })
    .where(and(eq(term.startDate, startDate), eq(term.isAutoCreated, true)));
}
