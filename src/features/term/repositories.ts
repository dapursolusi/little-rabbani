import { db } from '@/db';
import { term } from '@/db/schema';
import { and, gt, gte, isNull, lte } from 'drizzle-orm';

export async function findCurrentTerm(todayStr: string) {
  return await db.query.term.findFirst({
    where: and(
      isNull(term.deletedAt),
      gte(term.startDate, todayStr),
      lte(term.endDate, todayStr)
    ),
  });
}

export async function findNextTerm(todayStr: string) {
  return await db.query.term.findFirst({
    where: and(isNull(term.deletedAt), gt(term.startDate, todayStr)),
  });
}

export async function findAllTerms() {
  return await db.query.term.findMany({
    where: isNull(term.deletedAt),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

export async function insertTerm({
  name,
  startDate,
  endDate,
  isAutoCreated,
}: {
  name: string;
  startDate: string;
  endDate: string;
  isAutoCreated: boolean;
}) {
  const [inserted] = await db
    .insert(term)
    .values({
      name,
      startDate,
      endDate,
      isAutoCreated,
    })
    .returning();
  return inserted;
}
