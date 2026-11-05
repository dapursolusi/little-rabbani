import { db } from '@/db';
import { dcrObservation } from '@/db/schema/daily';
import { omitAuditColumns } from '@/db/selections/audit-columns';
import { leanKidColumnSelection } from '@/features/kid/repositories/kid';
import { and, eq } from 'drizzle-orm';

import { DcrObservation } from '../types';
import { DCRObservationInput } from '../validation';

// Insert

export async function insert(input: DCRObservationInput) {
  const [inserted] = await db.insert(dcrObservation).values(input).returning({
    id: dcrObservation.id,
  });

  if (!inserted) {
    throw new Error('Failed to insert DCR observation');
  }

  const result = await findById(inserted.id);

  if (!result) {
    throw new Error('Inserted DCR Observation not found');
  }

  return result satisfies DcrObservation;
}

// Find

export async function findById(id: string) {
  return db.query.dcrObservation.findFirst({
    where: eq(dcrObservation.id, id),
    columns: omitAuditColumns,
    with: {
      kid: { columns: { id: true, name: true, nickName: true } },
      kidReport: {
        columns: {
          id: true,
          dcrObservationId: true,
          narrative: true,
          reportStatus: true,
          sentAt: true,
        },
      },
    },
  });
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

export async function findByIdWithKid(id: string) {
  return await db.query.dcrObservation.findFirst({
    where: eq(dcrObservation.id, id),
    // columns: dcrObservationColumnSelection,
    columns: omitAuditColumns,
    with: {
      kid: {
        columns: leanKidColumnSelection,
      },
    },
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
    columns: omitAuditColumns,
    with: {
      kid: { columns: leanKidColumnSelection },
      kidReport: {
        columns: omitAuditColumns,
      },
    },
  });
}

// Upsert

// Update

export async function update(input: DCRObservationInput) {
  const { dcrId, kidId, ...mutable } = input;
  const [updated] = await db
    .update(dcrObservation)
    .set(mutable)
    .where(
      and(eq(dcrObservation.dcrId, dcrId), eq(dcrObservation.kidId, kidId))
    )
    .returning({ id: dcrObservation.id });

  if (!updated) {
    throw new Error('Failed to update DCR observation');
  }

  const result = await findById(updated.id);

  if (!result) {
    throw new Error('Updated DCR observation not found');
  }

  return result satisfies DcrObservation;
}

// Remove
