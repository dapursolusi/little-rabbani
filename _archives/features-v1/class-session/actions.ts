'use server';

import { db } from '@/db';
import { classSession } from '@/db/schema';
import { ClassSessionFormSchema } from '@/features/class-session/schema';
import { and, eq, ilike, isNull, sql } from 'drizzle-orm';

import { requireOwner } from '../../lib/actions/utils';

export async function getClassSessions(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const { search, limit = 50, offset = 0 } = params ?? {};

    const conditions = [
      eq(classSession.active, true),
      isNull(classSession.deletedAt),
    ];
    if (search) {
      conditions.push(ilike(classSession.name, `%${search}%`));
    }

    const where = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.classSession.findMany({
        where,
        orderBy: (classSession, { desc }) => [desc(classSession.createdAt)],
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(classSession)
        .where(where),
    ]);

    const total = totalResult?.[0]?.count ?? 0;

    return { success: true as const, data: items, total };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data sesi' };
  }
}

export async function getClassSession(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const result = await db.query.classSession.findFirst({
      where: eq(classSession.id, id),
    });

    if (!result) {
      return { success: false as const, error: 'Sesi tidak ditemukan' };
    }

    return { success: true as const, data: result };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data sesi' };
  }
}

export async function createClassSession(input: Record<string, unknown>) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = ClassSessionFormSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newItem] = await db
      .insert(classSession)
      .values(parsed.data)
      .returning();

    return { success: true as const, data: newItem };
  } catch {
    return { success: false as const, error: 'Gagal membuat sesi' };
  }
}

export async function updateClassSession(
  id: string,
  input: Record<string, unknown>
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = ClassSessionFormSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const existing = await db.query.classSession.findFirst({
    where: eq(classSession.id, id),
  });

  if (!existing) {
    return { success: false as const, error: 'Sesi tidak ditemukan' };
  }

  // ponytail: no-op if values unchanged — dedup by (name, start, end)
  if (
    existing.name === parsed.data.name &&
    existing.start === parsed.data.start &&
    existing.end === parsed.data.end
  ) {
    return { success: true as const, data: { old: existing, fresh: existing } };
  }

  // Deactivate old, insert new active row
  await db
    .update(classSession)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(classSession.id, id));

  const [fresh] = await db
    .insert(classSession)
    .values({ ...parsed.data, active: true })
    .returning();

  return { success: true as const, data: { old: existing, fresh } };
}

export async function deleteClassSession(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    await db
      .update(classSession)
      .set({ deletedAt: new Date() })
      .where(eq(classSession.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus sesi' };
  }
}
