import { db } from '@/db';
import { guardian, kid } from '@/db/schema';
import * as kidEnrollmentRepo from '@/features/kid-enrollment/repositories';
import { ListParams, TransactionClient } from '@/types';
import { SQL, and, ilike, isNull } from 'drizzle-orm';

import { requireOwner } from '@/lib/actions/require-owner';

import { GuardianSearchResult } from './actions';
import { guardianRepo, kidRepo } from './repositories';
import { CreateKidInput, GuardianInput, UpdateKidInput } from './schema';

export async function getKids(params?: ListParams) {
  return requireOwner(async () => {
    const { search, limit = 50, offset = 0 } = params ?? {};
    const conditions = search
      ? [ilike(kid.name, `%${search}%`), isNull(kid.deletedAt)]
      : [isNull(kid.deletedAt)];
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [kidsData, totalResult] = await Promise.all([
      kidRepo.findMany(limit, offset, where),
      kidRepo.count(where),
    ]);

    return {
      success: true as const,
      data: kidsData,
      total: totalResult?.[0]?.count ?? 0,
    };
  });
}

export async function getKid(id: string) {
  return requireOwner(async () => {
    try {
      const kid = await kidRepo.findById(id);
      if (!kid) {
        return { success: false as const, error: 'Murid tidak ditemukan' };
      }
      return { success: true as const, data: kid };
    } catch (error) {
      console.error('getKid', error);
      return { success: false as const, error: 'Gagal mengambil data murid' };
    }
  });
}

/** Narrow interface — the test surface; a fake tx only needs these shapes. */
export interface GuardianTx {
  query: {
    guardian: {
      findFirst: (opts: { where?: SQL<unknown> }) => Promise<
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

export type GuardianResolveResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'phone-conflict' | 'email-conflict' | 'not-found' };

/**
 * Create or update a guardian inside a transaction. Both create and update
 * route through this function so collision checks stay in one place. Never
 * throws for expected failures — returns a discriminated result instead.
 */
export async function resolveGuardian(
  tx: GuardianTx,
  data: GuardianInput,
  existingGuardianId?: string
): Promise<GuardianResolveResult> {
  const phoneMatch = await guardianRepo.findByPhone(
    data.phone,
    tx as unknown as TransactionClient,
    existingGuardianId
  );
  if (phoneMatch) {
    return { ok: false, reason: 'phone-conflict' };
  }

  if (data.email) {
    const emailMatch = await guardianRepo.findByEmail(
      data.email,
      tx as unknown as TransactionClient,
      existingGuardianId
    );
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

  if (existingGuardianId) {
    const existing = await guardianRepo.findById(
      existingGuardianId,
      tx as unknown as TransactionClient
    );
    if (!existing) {
      return { ok: false, reason: 'not-found' };
    }
    const updated = await guardianRepo.update(
      existingGuardianId,
      values,
      tx as unknown as TransactionClient
    );
    return { ok: true, id: updated.id };
  }

  const newGuardian = await guardianRepo.insert(
    values,
    tx as unknown as TransactionClient
  );
  return { ok: true, id: newGuardian.id };
}

export async function createKid(input: {
  kid: CreateKidInput;
  guardian?: GuardianInput;
  guardianId?: string;
  termId?: string;
  classSessionId?: string;
}) {
  return requireOwner(async () => {
    try {
      if (input.guardianId) {
        const existingGuardian = await guardianRepo.findById(input.guardianId);
        if (!existingGuardian) {
          return { success: false as const, error: 'Wali tidak ditemukan' };
        }
        const newKid = await kidRepo.insert({
          ...input.kid,
          guardianId: input.guardianId,
        });
        // Optional enrollment
        if (input.termId && input.classSessionId) {
          await kidEnrollmentRepo.insertMany([
            {
              termId: input.termId,
              classSessionId: input.classSessionId,
              kidId: newKid.id,
              status: 'enrolled',
            },
          ]);
        }
        return { success: true as const, data: newKid.name };
      }

      const transactionResult = await db.transaction(async (tx) => {
        const resolvedGuardian = await resolveGuardian(
          tx as unknown as GuardianTx,
          input.guardian as GuardianInput,
          input.guardianId
        );
        if (!resolvedGuardian.ok) return resolvedGuardian;

        const newKid = await kidRepo.insert(
          {
            ...input.kid,
            guardianId: resolvedGuardian.id,
          },
          tx
        );

        // Optional enrollment (same tx)
        if (input.termId && input.classSessionId) {
          await kidEnrollmentRepo.insertMany(
            [
              {
                termId: input.termId,
                classSessionId: input.classSessionId,
                kidId: newKid.id,
                status: 'enrolled',
              },
            ],
            tx
          );
        }

        return { ok: true as const, data: newKid.name };
      });

      if (!transactionResult.ok) return transactionResult;
      return { success: true as const, data: transactionResult.data };
    } catch (error) {
      console.error('createKid', error);
      return { success: false as const, error: 'Gagal menambahkan murid' };
    }
  });
}

export async function updateKid(
  kidId: string,
  input: {
    kid: UpdateKidInput;
    guardian?: GuardianInput;
    guardianId?: string;
  }
) {
  return requireOwner(async () => {
    try {
      if (input.guardianId) {
        const existingGuardian = await guardianRepo.findById(input.guardianId);
        if (!existingGuardian) {
          return { success: false as const, error: 'Wali tidak ditemukan' };
        }
        const updatedKid = await kidRepo.update(kidId, {
          ...input.kid,
          guardianId: input.guardianId,
        });

        if (!updatedKid) {
          return { success: false as const, error: 'Murid tidak ditemukan' };
        }

        return { success: true as const, data: updatedKid.name };
      }

      const existingKid = await kidRepo.findById(kidId);
      if (!existingKid) {
        return {
          success: false as const,
          error: 'Data murid yang ingin diubah tidak ditemukan',
        };
      }

      const transactionResult = await db.transaction(async (tx) => {
        // cast: NeonTransaction is structurally huge; the seam takes a narrow
        // GuardianTx (the test surface). Matches the zodResolver-as-never idiom.
        const resolvedGuardian = await resolveGuardian(
          tx as unknown as GuardianTx,
          input.guardian as GuardianInput,
          input.guardianId
        );
        if (!resolvedGuardian.ok)
          return { ok: false as const, reason: resolvedGuardian.reason };

        const updatedKid = await kidRepo.update(
          kidId,
          {
            ...input.kid,
            guardianId: resolvedGuardian.id,
          },
          tx
        );

        if (!updatedKid) return { ok: false as const, reason: 'not-found' };

        return { ok: true as const, updatedKid };
      });

      if (!transactionResult.ok) {
        const error =
          transactionResult.reason === 'email-conflict'
            ? 'Email wali sudah pernah terdaftar, gunakan data wali sebelumnya atau daftar wali yang baru'
            : transactionResult.reason === 'not-found'
              ? 'Wali yang dipilih tidak ditemukan'
              : 'Nomor telepon wali sudah pernah terdaftar, gunakan data wali sebelumnya atau daftar wali yang baru';
        return { success: false as const, error };
      }

      if (!transactionResult.updatedKid) {
        return { success: false as const, error: 'Murid tidak ditemukan' };
      }

      return {
        success: true as const,
        data: transactionResult.updatedKid.name,
      };
    } catch (error) {
      console.error('updateKid', error);
      return { success: false as const, error: 'Gagal memperbarui murid' };
    }
  });
}

export async function deleteKid(id: string) {
  return requireOwner(async () => {
    try {
      await kidRepo.remove(id);
      return { success: true as const, data: undefined };
    } catch (error) {
      console.error('deleteKid', error);
      return { success: false as const, error: 'Gagal menghapus murid' };
    }
  });
}

export async function searchGuardians(search: string) {
  return requireOwner(async () => {
    try {
      const rows = await guardianRepo.search(search);
      const data: GuardianSearchResult[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        secondContactName: row.secondContactName,
        secondContactPhone: row.secondContactPhone,
        kids: row.kidNames
          .filter((n): n is string => typeof n === 'string' && n.length > 0)
          .map((kidName, i) => ({ id: `${row.id}-${i}`, name: kidName })),
      }));
      return { success: true as const, data };
    } catch (error) {
      console.error('searchGuardians', error);
      return { success: false as const, error: 'Gagal mencari wali' };
    }
  });
}
