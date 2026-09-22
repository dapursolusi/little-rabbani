import { db } from '@/db';
import { theme } from '@/db/schema';
import { and, eq, ilike, isNull, sql } from 'drizzle-orm';

import type { ThemeInput } from '../schema';

export async function findMany() {
  return await db.query.theme.findMany({
    where: isNull(theme.deletedAt),
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function findManyWithCount({
  search,
  limit = 50,
  offset = 0,
}: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [isNull(theme.deletedAt)];
  if (search) conditions.push(ilike(theme.name, `%${search}%`));
  const where = and(...conditions);

  const [items, totalResult] = await Promise.all([
    db.query.theme.findMany({
      where,
      orderBy: (t, { asc }) => [asc(t.name)],
      limit,
      offset,
      with: { subThemes: true },
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(theme)
      .where(where),
  ]);

  const total = totalResult?.[0]?.count ?? 0;
  return { items, total };
}

export async function findById(id: string) {
  return await db.query.theme.findFirst({
    where: and(isNull(theme.deletedAt), eq(theme.id, id)),
  });
}

export async function insert(input: ThemeInput) {
  const [inserted] = await db.insert(theme).values(input).returning();
  return inserted;
}

export async function update(id: string, input: ThemeInput) {
  const [updated] = await db
    .update(theme)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(theme.id, id))
    .returning();
  return updated;
}

export async function remove(id: string) {
  const [deleted] = await db
    .update(theme)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(theme.id, id))
    .returning();
  return deleted;
}
