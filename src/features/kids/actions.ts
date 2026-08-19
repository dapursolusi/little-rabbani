'use server';

import { db } from '@/db';
import { guardian, kid } from '@/db/schema';
import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';

import { parseInput } from '@/lib/actions/parse-input';
import { requireOwner } from '@/lib/actions/require-owner';

import { type GuardianTx, upsertGuardianTx } from './guardian';
import { CreateGuardianSchema, CreateKidSchema } from './schemas';
import { LeanKid } from './types';

// ── Reads ─────────────────────────────────────────────

export async function getKids(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return requireOwner(async () => {
    const { search, limit = 50, offset = 0 } = params ?? {};
    const conditions = search
      ? [ilike(kid.name, `%${search}%`), isNull(kid.deletedAt)]
      : [isNull(kid.deletedAt)];
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [kidsData, totalResult] = await Promise.all([
      db.query.kid.findMany({
        where,
        with: { guardian: true },
        orderBy: (kid, { desc }) => [desc(kid.createdAt)],
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(kid)
        .where(where),
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
    const result = await db.query.kid.findFirst({
      where: eq(kid.id, id),
      with: { guardian: true },
    });

    if (!result)
      return { success: false as const, error: 'Murid tidak ditemukan' };

    return { success: true as const, data: result };
  });
}

// ── Mutations ─────────────────────────────────────────

export async function createKid(input: {
  kid: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  guardianId?: string;
}) {
  return requireOwner(async () => {
    const parsedKid = parseInput(
      CreateKidSchema,
      input.kid,
      'Data anak tidak valid'
    );
    if (!parsedKid.success) return parsedKid;
    const kidData = parsedKid.data;

    // Pick-existing path: skip guardian parse + collision checks + insert.
    if (input.guardianId) {
      try {
        const target = await db.query.guardian.findFirst({
          where: and(
            eq(guardian.id, input.guardianId),
            isNull(guardian.deletedAt)
          ),
        });
        if (!target) {
          return {
            success: false as const,
            error: 'Wali yang dipilih tidak ditemukan',
          };
        }
        const [insertedKid] = await db
          .insert(kid)
          .values({
            name: kidData.name,
            nickName: kidData.nickName || null,
            gender: kidData.gender,
            dob: kidData.dob,
            relationship: kidData.relationship,
            guardianId: input.guardianId,
          })
          .returning();

        return {
          success: true as const,
          data: { name: insertedKid?.name },
        };
      } catch (error) {
        console.error('createKid', error);
        return { success: false as const, error: 'Gagal menambah murid baru' };
      }
    }

    const parsedGuardian = parseInput(
      CreateGuardianSchema,
      input.guardian,
      'Data wali tidak valid'
    );
    if (!parsedGuardian.success) return parsedGuardian;
    const guardianData = parsedGuardian.data;

    try {
      const transactionResult = await db.transaction(async (tx) => {
        // cast: NeonTransaction is structurally huge; the seam takes a narrow
        // GuardianTx (the test surface). Matches the zodResolver-as-never idiom.
        const guardianResult = await upsertGuardianTx(
          tx as unknown as GuardianTx,
          guardianData
        );
        if (!guardianResult.ok) return guardianResult;

        const [insertedKid] = await tx
          .insert(kid)
          .values({
            name: kidData.name,
            nickName: kidData.nickName || null,
            gender: kidData.gender,
            dob: kidData.dob,
            relationship: kidData.relationship,
            guardianId: guardianResult.id,
          })
          .returning();

        return { ok: true as const, insertedKid };
      });

      if (!transactionResult.ok) {
        const error =
          transactionResult.reason === 'email-conflict'
            ? 'Email wali sudah pernah terdaftar, gunakan data wali sebelumnya atau daftar wali yang baru'
            : 'Nomor telepon wali sudah pernah terdaftar, gunakan data wali sebelumnya atau daftar wali yang baru';
        return { success: false as const, error };
      }

      return {
        success: true as const,
        data: { name: transactionResult.insertedKid.name },
      };
    } catch (error) {
      console.error('createKid', error);
      return { success: false as const, error: 'Gagal menambah murid baru' };
    }
  });
}

export async function updateKid(
  kidId: string,
  input: {
    kid: Record<string, unknown>;
    guardian?: Record<string, unknown>;
    guardianId?: string;
  }
) {
  return requireOwner(async () => {
    const parsedKid = parseInput(
      CreateKidSchema,
      input.kid,
      'Data anak tidak valid'
    );
    if (!parsedKid.success) return parsedKid;
    const kidData = parsedKid.data;

    // Pick-existing path: re-point the kid's guardian only, don't touch the
    // guardian row.
    if (input.guardianId) {
      try {
        const target = await db.query.guardian.findFirst({
          where: and(
            eq(guardian.id, input.guardianId),
            isNull(guardian.deletedAt)
          ),
        });
        if (!target) {
          return {
            success: false as const,
            error: 'Wali yang dipilih tidak ditemukan',
          };
        }
        const [updatedKid] = await db
          .update(kid)
          .set({
            name: kidData.name,
            nickName: kidData.nickName || null,
            gender: kidData.gender,
            dob: kidData.dob,
            relationship: kidData.relationship,
            guardianId: input.guardianId,
          })
          .where(eq(kid.id, kidId))
          .returning();

        if (!updatedKid) {
          return { success: false as const, error: 'Murid tidak ditemukan' };
        }

        return { success: true as const, data: updatedKid.name };
      } catch (error) {
        console.error('updateKid', error);
        return { success: false as const, error: 'Gagal memperbarui murid' };
      }
    }

    const parsedGuardian = parseInput(
      CreateGuardianSchema,
      input.guardian,
      'Data wali tidak valid'
    );
    if (!parsedGuardian.success) return parsedGuardian;
    const guardianData = parsedGuardian.data;

    try {
      const existingKid = await db.query.kid.findFirst({
        where: eq(kid.id, kidId),
        with: { guardian: true },
      });
      if (!existingKid) {
        return {
          success: false as const,
          error: 'Data murid yang ingin diubah tidak ditemukan',
        };
      }

      const transactionResult = await db.transaction(async (tx) => {
        // cast: NeonTransaction is structurally huge; the seam takes a narrow
        // GuardianTx (the test surface). Matches the zodResolver-as-never idiom.
        const guardianResult = await upsertGuardianTx(
          tx as unknown as GuardianTx,
          guardianData,
          { existingGuardianId: existingKid.guardianId }
        );
        if (!guardianResult.ok) return guardianResult;

        const [updatedKid] = await tx
          .update(kid)
          .set({
            name: kidData.name,
            nickName: kidData.nickName || null,
            gender: kidData.gender,
            dob: kidData.dob,
            relationship: kidData.relationship,
            guardianId: guardianResult.id,
          })
          .where(eq(kid.id, kidId))
          .returning();

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
      await db.update(kid).set({ deletedAt: new Date() }).where(eq(kid.id, id));
      return { success: true as const, data: undefined };
    } catch (error) {
      console.error('deleteKid', error);
      return { success: false as const, error: 'Gagal menghapus murid' };
    }
  });
}

export interface GuardianSearchResult {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  secondContactName: string | null;
  secondContactPhone: string | null;
  kids: LeanKid[];
}

export async function searchGuardians(
  search: string
): Promise<
  | { success: true; data: GuardianSearchResult[] }
  | { success: false; error: string }
> {
  return requireOwner(async () => {
    if (!search.trim()) return { success: true as const, data: [] };

    const rows = await db
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
  });
}
