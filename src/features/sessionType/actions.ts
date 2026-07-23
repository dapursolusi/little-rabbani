'use server';

import { db } from '@/db';
import { sessionType } from '@/db/schema';
import { SessionTypeFormSchema } from '@/features/sessionType/schema';
import { and, eq, ilike, isNull, sql } from 'drizzle-orm';

import { requireOwner } from '../../lib/actions/utils';

export async function getSessionTypes(params?: {
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
      eq(sessionType.active, true),
      isNull(sessionType.deletedAt),
    ];
    if (search) {
      conditions.push(ilike(sessionType.name, `%${search}%`));
    }

    const where = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.sessionType.findMany({
        where,
        orderBy: (sessionType, { desc }) => [desc(sessionType.createdAt)],
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sessionType)
        .where(where),
    ]);

    const total = totalResult?.[0]?.count ?? 0;

    return { success: true as const, data: items, total };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data sesi' };
  }
}

export async function getSessionType(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const result = await db.query.sessionType.findFirst({
      where: eq(sessionType.id, id),
    });

    if (!result) {
      return { success: false as const, error: 'Sesi tidak ditemukan' };
    }

    return { success: true as const, data: result };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data sesi' };
  }
}

export async function createSessionType(input: Record<string, unknown>) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = SessionTypeFormSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newItem] = await db
      .insert(sessionType)
      .values(parsed.data)
      .returning();

    return { success: true as const, data: newItem };
  } catch {
    return { success: false as const, error: 'Gagal membuat sesi' };
  }
}

export async function updateSessionType(
  id: string,
  input: Record<string, unknown>
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = SessionTypeFormSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const existing = await db.query.sessionType.findFirst({
    where: eq(sessionType.id, id),
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
    .update(sessionType)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(sessionType.id, id));

  const [fresh] = await db
    .insert(sessionType)
    .values({ ...parsed.data, active: true })
    .returning();

  return { success: true as const, data: { old: existing, fresh } };
}

export async function deleteSessionType(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    await db
      .update(sessionType)
      .set({ deletedAt: new Date() })
      .where(eq(sessionType.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus sesi' };
  }
}
