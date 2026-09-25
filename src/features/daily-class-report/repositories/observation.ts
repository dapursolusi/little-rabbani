import { db } from '@/db';
import { dcrObservation } from '@/db/schema/daily';
import { and, eq } from 'drizzle-orm';

import { DCRObservationInput } from '../validation';

export async function insert(input: DCRObservationInput) {
  const [inserted] = await db.insert(dcrObservation).values(input).returning();
  return inserted;
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
