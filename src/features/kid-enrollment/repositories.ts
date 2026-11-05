import { db } from '@/db';
import { kid, kidEnrollment } from '@/db/schema';
import { omitAuditColumns } from '@/db/selections/audit-columns';
import { ACTIVE_STATUS } from '@/features/kid/constants';
import { TransactionClient } from '@/types';
import { SQL, and, eq, exists, inArray, isNull, not } from 'drizzle-orm';

import { leanKidColumnSelection } from '../kid/repositories/kid';
import { EnrollmentStatus } from './constants';
import { KidEnrollmentInsert } from './types';

export async function hasKidEnrollment({
  termId,
  kidId,
}: {
  termId: string;
  kidId: string;
}) {
  return db.query.kidEnrollment.findFirst({
    where: and(
      eq(kidEnrollment.termId, termId),
      eq(kidEnrollment.kidId, kidId)
    ),
    columns: { id: true, classSessionId: true },
  });
}

export async function findMany({
  termId,
  classSessionId,
  where,
}: {
  termId?: string;
  classSessionId?: string;
  where?: SQL<unknown>;
}) {
  return db.query.kidEnrollment.findMany({
    where: and(
      where,
      isNull(kidEnrollment.deletedAt),
      termId ? eq(kidEnrollment.termId, termId) : undefined,
      classSessionId
        ? eq(kidEnrollment.classSessionId, classSessionId)
        : undefined
    ),
    columns: omitAuditColumns,
    with: {
      kid: { columns: leanKidColumnSelection },
    },
  });
}

export async function findManyWithRelations({
  termId,
  classSessionId,
  where,
}: {
  termId?: string;
  classSessionId?: string;
  where?: SQL<unknown>;
}) {
  return db.query.kidEnrollment.findMany({
    where: and(
      where,
      isNull(kidEnrollment.deletedAt),
      termId ? eq(kidEnrollment.termId, termId) : undefined,
      classSessionId
        ? eq(kidEnrollment.classSessionId, classSessionId)
        : undefined
    ),
    columns: omitAuditColumns,
    with: {
      kid: { columns: leanKidColumnSelection },
      term: { columns: { id: true, name: true } },
      classSession: { columns: { id: true, name: true } },
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
      eq(kid.activeStatus, ACTIVE_STATUS.ACTIVE),
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
    columns: omitAuditColumns,
  });
}

export async function findCsIdByTermId({
  kidId,
  termId,
}: {
  kidId: string;
  termId: string;
}) {
  return db.query.kidEnrollment.findFirst({
    where: and(
      eq(kidEnrollment.termId, termId),
      eq(kidEnrollment.kidId, kidId)
    ),
    columns: { classSessionId: true },
  });
}

export async function insertMany(
  input: KidEnrollmentInsert[],
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
