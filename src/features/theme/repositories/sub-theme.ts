import { db } from '@/db';
import { subTheme } from '@/db/schema';
import { omitAuditColumns } from '@/db/selections/audit-columns';
import { and, eq, isNull } from 'drizzle-orm';

import { SubTheme } from '../types';
import type { SubThemeInput } from '../validation';

export const subThemeColumnSelection = {
  id: true,
  themeId: true,
  name: true,
} as const satisfies Record<keyof SubTheme, boolean>;

export async function findMany(params?: { themeId?: string }) {
  const conditions = [isNull(subTheme.deletedAt)];
  if (params?.themeId) conditions.push(eq(subTheme.themeId, params.themeId));

  return await db.query.subTheme.findMany({
    where: and(...conditions),
    columns: omitAuditColumns,
    with: { theme: { columns: omitAuditColumns } },
    orderBy: (st, { asc }) => [asc(st.name)],
  });
}

export async function findManyWithTheme() {
  return await db.query.subTheme.findMany({
    where: isNull(subTheme.deletedAt),
    columns: omitAuditColumns,
    with: { theme: { columns: omitAuditColumns } },
    orderBy: (st, { asc }) => [asc(st.name)],
  });
}

export async function findById(id: string) {
  return await db.query.subTheme.findFirst({
    where: and(isNull(subTheme.deletedAt), eq(subTheme.id, id)),
    columns: omitAuditColumns,
  });
}

export async function insert(input: SubThemeInput) {
  const [inserted] = await db.insert(subTheme).values(input).returning();
  return inserted;
}

export async function update(id: string, input: SubThemeInput) {
  const [updated] = await db
    .update(subTheme)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(subTheme.id, id))
    .returning();
  return updated;
}

export async function remove(id: string) {
  const [deleted] = await db
    .update(subTheme)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(subTheme.id, id))
    .returning();
  return deleted;
}

export async function findActive(params?: {
  themeId?: string;
  withTheme?: boolean;
}) {
  const conditions = [isNull(subTheme.deletedAt)];
  if (params?.themeId) conditions.push(eq(subTheme.themeId, params.themeId));

  return await db.query.subTheme.findMany({
    where: and(...conditions),
    columns: omitAuditColumns,
    ...(params?.withTheme
      ? { with: { theme: { columns: omitAuditColumns } } }
      : {}),
    orderBy: (st, { asc }) => [asc(st.name)],
  });
}
