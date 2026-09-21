import { db } from '@/db';
import { term } from '@/db/schema';
import { and, eq, gt, gte, isNull, lt, lte } from 'drizzle-orm';

import { TermInput } from './schema';

export async function findCurrent(todayStr: string) {
  return await db.query.term.findFirst({
    where: and(
      isNull(term.deletedAt),
      lte(term.startDate, todayStr),
      gte(term.endDate, todayStr)
    ),
  });
}

export async function findNext(todayStr: string) {
  return await db.query.term.findFirst({
    where: and(isNull(term.deletedAt), gt(term.startDate, todayStr)),
  });
}

export async function findAll() {
  return await db.query.term.findMany({
    where: isNull(term.deletedAt),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

export async function findById(id: string) {
  return await db.query.term.findFirst({
    where: and(isNull(term.deletedAt), eq(term.id, id)),
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
