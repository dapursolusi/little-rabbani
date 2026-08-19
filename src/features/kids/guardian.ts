import { guardian } from '@/db/schema';
import { and, eq, isNotNull, isNull, ne } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import type { CreateGuardianInput } from './schemas';

/** Narrow interface — the test surface; a fake tx only needs these shapes. */
export interface GuardianTx {
  query: {
    guardian: {
      findFirst: (opts: {
        where?: SQL<unknown>;
      }) => Promise<
        | {
            id: string;
            phone: string;
            email: string | null;
            deletedAt: Date | null;
          }
        | undefined
      >;
    };
  };
  insert: (table: typeof guardian) => {
    values: (values: unknown) => {
      returning: () => Promise<Array<{ id: string }>>;
    };
  };
  update: (table: typeof guardian) => {
    set: (values: unknown) => {
      where: (cond: SQL<unknown>) => {
        returning: () => Promise<Array<{ id: string }>>;
      };
    };
  };
}

export type GuardianUpsertResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'phone-conflict' | 'email-conflict' | 'not-found' };

export type GuardianInput = CreateGuardianInput;

/**
 * Create or update a guardian inside a transaction. Both create and update
 * route through this function so collision checks stay in one place. Never
 * throws for expected failures — returns a discriminated result instead.
 */
export async function upsertGuardianTx(
  tx: GuardianTx,
  data: GuardianInput,
  opts?: { existingGuardianId?: string }
): Promise<GuardianUpsertResult> {
  const idNe = opts?.existingGuardianId
    ? ne(guardian.id, opts.existingGuardianId)
    : undefined;

  const phoneMatch = await tx.query.guardian.findFirst({
    where: and(
      eq(guardian.phone, data.phone),
      isNull(guardian.deletedAt),
      idNe
    ),
  });
  if (phoneMatch) {
    return { ok: false, reason: 'phone-conflict' };
  }

  if (data.email) {
    const emailMatch = await tx.query.guardian.findFirst({
      where: and(
        isNotNull(guardian.email),
        eq(guardian.email, data.email),
        isNull(guardian.deletedAt),
        idNe
      ),
    });
    if (emailMatch) {
      return { ok: false, reason: 'email-conflict' };
    }
  }

  const values = {
    name: data.name,
    phone: data.phone,
    email: data.email ?? null,
    secondContactName: data.secondContactName ?? null,
    secondContactPhone: data.secondContactPhone ?? null,
  };

  if (opts?.existingGuardianId) {
    const rows = await tx
      .update(guardian)
      .set(values)
      .where(eq(guardian.id, opts.existingGuardianId))
      .returning();
    if (rows.length === 0) {
      return { ok: false, reason: 'not-found' };
    }
    return { ok: true, id: rows[0].id };
  }

  const [row] = await tx.insert(guardian).values(values).returning();
  return { ok: true, id: row.id };
}
