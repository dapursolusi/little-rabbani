import { db } from '@/db';
import { kid } from '@/db/schema';
import { TransactionClient } from '@/types';
import { SQL, eq, sql } from 'drizzle-orm';

import { UpdateKidInput } from '../schema';

export async function findMany(
  limit?: number,
  offset?: number,
  where?: SQL<unknown>
) {
  return await db.query.kid.findMany({
    where,
    with: { guardian: true },
    orderBy: (kid, { desc }) => [desc(kid.createdAt)],
    limit,
    offset,
  });
}

export async function findById(id: string) {
  return await db.query.kid.findFirst({
    where: eq(kid.id, id),
    with: { guardian: true },
  });
}

export async function count(where?: SQL<unknown>) {
  return await db
    .select({ count: sql<number>`count(*)` })
    .from(kid)
    .where(where);
}

export async function insert(kidData: UpdateKidInput, tx?: TransactionClient) {
  const session = tx ? tx : db;
  const [inserted] = await session
    .insert(kid)
    .values({
      name: kidData.name,
      nickName: kidData.nickName || null,
      gender: kidData.gender,
      dob: kidData.dob,
      relationship: kidData.relationship,
      guardianId: kidData.guardianId,
    })
    .returning();

  return inserted;
}

export async function update(
  kidId: string,
  kidData: UpdateKidInput,
  tx?: TransactionClient
) {
  const session = tx ? tx : db;
  const [updated] = await session
    .update(kid)
    .set({
      name: kidData.name,
      nickName: kidData.nickName || null,
      gender: kidData.gender,
      dob: kidData.dob,
      relationship: kidData.relationship,
      guardianId: kidData.guardianId,
    })
    .where(eq(kid.id, kidId))
    .returning();
  return updated;
}

export async function remove(id: string) {
  return await db.delete(kid).where(eq(kid.id, id));
}
