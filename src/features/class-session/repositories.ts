import { db } from '@/db';
import { classSession } from '@/db/schema';
import { and, count as drizzleCount, eq, gt, isNull, lt } from 'drizzle-orm';

import { ClassSessionInput, OverlappingClassSessionInput } from './schema';

export async function findOverlapping({
  startTime,
  endTime,
}: OverlappingClassSessionInput) {
  return await db.query.classSession.findFirst({
    where: and(
      isNull(classSession.deletedAt),
      lt(classSession.startTime, endTime),
      gt(classSession.endTime, startTime)
    ),
  });
}

export async function insert(input: ClassSessionInput) {
  return await db.insert(classSession).values(input).returning();
}

export async function update(id: string, input: ClassSessionInput) {
  return await db
    .update(classSession)
    .set(input)
    .where(eq(classSession.id, id))
    .returning();
}

export async function findMany() {
  return await db.query.classSession.findMany({
    where: isNull(classSession.deletedAt),
    orderBy: (classSession, { desc }) => [desc(classSession.createdAt)],
  });
}

export async function count() {
  const [{ count: total }] = await db
    .select({ count: drizzleCount() })
    .from(classSession)
    .where(isNull(classSession.deletedAt));

  return total;
}

export async function remove(id: string) {
  const [deleted] = await db
    .update(classSession)
    .set({ deletedAt: new Date() })
    .where(eq(classSession.id, id))
    .returning();

  return deleted;
}
