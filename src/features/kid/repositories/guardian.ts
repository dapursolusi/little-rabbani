import { db } from '@/db';
import { guardian, kid } from '@/db/schema';
import { TransactionClient } from '@/types';
import { and, eq, ilike, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';

import { GuardianInput } from '../schema';

export async function findById(id: string, tx?: TransactionClient) {
  const session = tx ? tx : db;
  return await session.query.guardian.findFirst({
    where: eq(guardian.id, id),
    with: { kids: true },
  });
}

export async function findByPhone(
  phone: string,
  tx?: TransactionClient,
  excludeId?: string
) {
  const session = tx ? tx : db;
  return await session.query.guardian.findFirst({
    where: and(
      eq(guardian.phone, phone),
      isNull(guardian.deletedAt),
      excludeId ? ne(guardian.id, excludeId) : undefined
    ),
    with: { kids: true },
  });
}

export async function findByEmail(
  email: string,
  tx?: TransactionClient,
  excludeId?: string
) {
  const session = tx ? tx : db;
  return await session.query.guardian.findFirst({
    where: and(
      isNotNull(guardian.email),
      eq(guardian.email, email),
      isNull(guardian.deletedAt),
      excludeId ? ne(guardian.id, excludeId) : undefined
    ),
    with: { kids: true },
  });
}

export async function insert(input: GuardianInput, tx?: TransactionClient) {
  const session = tx ? tx : db;
  const [inserted] = await session.insert(guardian).values(input).returning();

  return inserted;
}

export async function update(
  id: string,
  input: GuardianInput,
  tx?: TransactionClient
) {
  const session = tx ? tx : db;
  const [updated] = await session
    .update(guardian)
    .set(input)
    .where(eq(guardian.id, id))
    .returning();

  return updated;
}

export async function search(search: string) {
  return await db
    .select({
      id: guardian.id,
      name: guardian.name,
      phone: guardian.phone,
      email: guardian.email,
      secondContactName: guardian.secondContactName,
      secondContactPhone: guardian.secondContactPhone,
      kidNames: sql<
        string[]
      >`coalesce(array_agg(kid.name) filter (where kid.deleted_at is null), '{}')`,
    })
    .from(guardian)
    .leftJoin(kid, eq(kid.guardianId, guardian.id))
    .where(
      and(
        isNull(guardian.deletedAt),
        or(
          ilike(guardian.name, `%${search}%`),
          ilike(guardian.phone, `%${search}%`)
        )
      )
    )
    .groupBy(guardian.id)
    .limit(10);
}
