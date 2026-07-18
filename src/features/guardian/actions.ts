'use server';

import { GuardianFormSchema } from '@/features/guardian/schema';
import { and, eq, ilike, isNull, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { guardian, kid } from '@/lib/db/schema';

import { requireOwner } from '../../lib/actions/utils';

export async function getGuardians(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const { search, limit = 50, offset = 0 } = params ?? {};

  const conditions = search
    ? [ilike(guardian.name, `%${search}%`), isNull(guardian.deletedAt)]
    : [isNull(guardian.deletedAt)];
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [guardians, totalResult] = await Promise.all([
    db.query.guardian.findMany({
      where,
      orderBy: (guardian, { asc }) => [asc(guardian.name)],
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(guardian)
      .where(where),
  ]);

  // Count kids per guardian
  const result = await Promise.all(
    guardians.map(async (g) => {
      const kidsData = await db
        .select({ id: kid.id, name: kid.name, status: kid.status })
        .from(kid)
        .where(eq(kid.guardianId, g.id));
      return { ...g, kids: kidsData };
    })
  );

  const total = totalResult?.[0]?.count ?? 0;
  return { success: true as const, data: result, total };
}

export async function getGuardian(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const result = await db.query.guardian.findFirst({
    where: eq(guardian.id, id),
  });

  if (!result) {
    return { success: false as const, error: 'Wali murid tidak ditemukan' };
  }

  const kids = await db
    .select({ id: kid.id, name: kid.name, status: kid.status })
    .from(kid)
    .where(eq(kid.guardianId, id));

  return { success: true as const, data: { ...result, kids } };
}

export async function createGuardian(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = GuardianFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { email, secondContactName, secondContactPhone, ...required } =
    parsed.data;

  try {
    const [newGuardian] = await db
      .insert(guardian)
      .values({
        ...required,
        email: email || null,
        secondContactName: secondContactName || null,
        secondContactPhone: secondContactPhone || null,
      })
      .returning();

    return { success: true as const, data: newGuardian };
  } catch {
    return { success: false as const, error: 'Gagal membuat wali murid' };
  }
}

export async function updateGuardian(
  id: string,
  input: FormData | Record<string, unknown>
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = GuardianFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { email, secondContactName, secondContactPhone, ...required } =
    parsed.data;

  try {
    const [updated] = await db
      .update(guardian)
      .set({
        ...required,
        email: email || null,
        secondContactName: secondContactName || null,
        secondContactPhone: secondContactPhone || null,
        updatedAt: new Date(),
      })
      .where(eq(guardian.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Wali murid tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui wali murid' };
  }
}

export async function deleteGuardian(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  // Check if guardian has linked kids
  const linkedKids = await db
    .select({ id: kid.id })
    .from(kid)
    .where(eq(kid.guardianId, id));

  if (linkedKids.length > 0) {
    return {
      success: false as const,
      error: 'Hapus atau pindahkan murid terlebih dahulu',
    };
  }

  try {
    await db
      .update(guardian)
      .set({ deletedAt: new Date() })
      .where(eq(guardian.id, id));

    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus wali murid' };
  }
}
