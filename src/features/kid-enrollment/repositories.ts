import { db } from '@/db';
import { EnrollmentStatus, kid, kidEnrollment } from '@/db/schema';
import { TransactionClient } from '@/types';
import { SQL, and, eq, exists, inArray, isNull, not } from 'drizzle-orm';

import { LeanKidEnrollment } from './types';

export async function findMany({
  termId,
  classSessionId,
  where,
}: {
  termId?: string;
  classSessionId?: string;
  where?: SQL<unknown>;
}) {
  return await db.query.kidEnrollment.findMany({
    where: and(
      where,
      isNull(kidEnrollment.deletedAt),
      termId ? eq(kidEnrollment.termId, termId) : undefined,
      classSessionId
        ? eq(kidEnrollment.classSessionId, classSessionId)
        : undefined
    ),
    with: {
      kid: { columns: { id: true, name: true } },
      classSession: { columns: { name: true } },
      term: { columns: { name: true } },
    },
  });
}

export async function findAvailableKids({
  termId,
  classSessionId,
}: {
  termId: string;
  classSessionId: string;
}) {
  return await db.query.kid.findMany({
    where: and(
      isNull(kid.deletedAt),
      eq(kid.activeStatus, 'active'),
      not(
        exists(
          db
            .select()
            .from(kidEnrollment)
            .where(
              and(
                eq(kidEnrollment.kidId, kid.id),
                eq(kidEnrollment.termId, termId),
                classSessionId
                  ? eq(kidEnrollment.classSessionId, classSessionId)
                  : undefined,
                isNull(kidEnrollment.deletedAt)
              )
            )
        )
      )
    ),
  });
}

export async function insertMany(
  input: LeanKidEnrollment[],
  tx?: TransactionClient
) {
  const session = tx ? tx : db;
  return await session.insert(kidEnrollment).values(input).returning();
}

export async function findForBatch({
  termId,
  classSessionId,
}: {
  termId: string;
  classSessionId: string;
}) {
  return await db.query.kidEnrollment.findMany({
    where: and(
      isNull(kidEnrollment.deletedAt),
      eq(kidEnrollment.termId, termId),
      eq(kidEnrollment.classSessionId, classSessionId)
    ),
    columns: { id: true, kidId: true, status: true },
  });
}

export async function softDeleteMany(ids: string[], tx?: TransactionClient) {
  const session = tx ? tx : db;
  if (ids.length === 0) return;
  await session
    .update(kidEnrollment)
    .set({ deletedAt: new Date() })
    .where(inArray(kidEnrollment.id, ids));
}

export async function updateStatus(
  id: string,
  status: EnrollmentStatus,
  tx: TransactionClient
) {
  const session = tx ? tx : db;
  await session
    .update(kidEnrollment)
    .set({ status })
    .where(and(isNull(kidEnrollment.deletedAt), eq(kidEnrollment.id, id)));
}

export async function updateManyStatus(
  updates: { id: string; status: EnrollmentStatus }[]
) {
  if (updates.length === 0) return;
  await Promise.all(
    updates.map(({ id, status }) =>
      db
        .update(kidEnrollment)
        .set({ status })
        .where(and(isNull(kidEnrollment.deletedAt), eq(kidEnrollment.id, id)))
    )
  );
}
