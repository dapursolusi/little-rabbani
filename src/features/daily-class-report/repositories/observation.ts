import { db } from '@/db';
import { dcrObservation } from '@/db/schema/daily';
import { and, eq } from 'drizzle-orm';

import { DCRObservationInput } from '../validation';

export async function insert(input: DCRObservationInput) {
  const [inserted] = await db.insert(dcrObservation).values(input).returning();
  return inserted;
}

export async function update(input: DCRObservationInput) {
  const { dcrId, kidId, ...mutable } = input;
  const [updated] = await db
    .update(dcrObservation)
    .set(mutable)
    .where(
      and(eq(dcrObservation.dcrId, dcrId), eq(dcrObservation.kidId, kidId))
    )
    .returning();
  return updated;
}

export async function findObservation({
  dcrId,
  kidId,
}: {
  dcrId: string;
  kidId: string;
}) {
  return await db.query.dcrObservation.findFirst({
    where: and(
      eq(dcrObservation.kidId, kidId),
      eq(dcrObservation.dcrId, dcrId)
    ),
  });
}

export async function findMany({
  dcrId,
  kidId,
}: {
  dcrId?: string;
  kidId?: string;
}) {
  const filters = [
    kidId ? eq(dcrObservation.kidId, kidId) : undefined,
    dcrId ? eq(dcrObservation.dcrId, dcrId) : undefined,
  ].filter((f) => f !== undefined);
  if (filters.length === 0) return [];

  return await db.query.dcrObservation.findMany({
    where: and(...filters),
    with: {
      kid: { columns: { id: true, name: true } },
    },
  });
}
