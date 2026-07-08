'use server';

import { and, eq, ilike, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

import { requireOwner } from '@/lib/actions/utils';
import { db } from '@/lib/db';
import { activity } from '@/lib/db/schema';

const ActivityFormSchema = z.object({
  name: z.string().min(1, 'Nama aktivitas wajib diisi'),
  category: z
    .enum([
      'seni',
      'olahraga',
      'musik',
      'bahasa',
      'matematika',
      'sains',
      'agama',
      'bermain',
      'outing',
      'lainnya',
    ])
    .optional()
    .default('lainnya'),
});

export type ActivityFormData = z.infer<typeof ActivityFormSchema>;

export type ActivityWithArchive = typeof activity.$inferSelect;

type ActivityActionResult =
  | { success: true; data: typeof activity.$inferSelect }
  | { success: false; error: string };

export async function getActivities(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const { search, limit = 50, offset = 0 } = params ?? {};

  const conditions = search ? [ilike(activity.name, `%${search}%`)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [activities, totalResult] = await Promise.all([
    db.query.activity.findMany({
      where,
      orderBy: (a, { asc }) => [asc(a.name)],
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(activity)
      .where(where),
  ]);

  const total = totalResult?.[0]?.count ?? 0;
  return { success: true as const, data: activities, total };
}

export async function getActiveActivities() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const activities = await db.query.activity.findMany({
    where: eq(activity.isDeleted, false),
    orderBy: (a, { asc }) => [asc(a.name)],
  });

  return { success: true as const, data: activities };
}

export async function getActivity(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const result = await db.query.activity.findFirst({
    where: eq(activity.id, id),
  });

  if (!result) {
    return { success: false as const, error: 'Aktivitas tidak ditemukan' };
  }

  return { success: true as const, data: result };
}

export async function createActivity(
  formData: FormData
): Promise<ActivityActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = ActivityFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newActivity] = await db
      .insert(activity)
      .values({
        name: parsed.data.name,
        category: parsed.data.category as ActivityFormData['category'],
      })
      .returning();

    return { success: true as const, data: newActivity };
  } catch {
    return { success: false as const, error: 'Gagal membuat aktivitas' };
  }
}

export async function updateActivity(
  id: string,
  formData: FormData
): Promise<ActivityActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = ActivityFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [updated] = await db
      .update(activity)
      .set({
        name: parsed.data.name,
        category: parsed.data.category as ActivityFormData['category'],
        updatedAt: new Date(),
      })
      .where(eq(activity.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Aktivitas tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui aktivitas' };
  }
}

export async function softDeleteActivity(
  id: string
): Promise<ActivityActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const [updated] = await db
      .update(activity)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(activity.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Aktivitas tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal mengarsipkan aktivitas' };
  }
}

export async function restoreActivity(
  id: string
): Promise<ActivityActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const [updated] = await db
      .update(activity)
      .set({
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(activity.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Aktivitas tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memulihkan aktivitas' };
  }
}

export async function deleteActivityPermanently(
  id: string
): Promise<
  { success: true; data: undefined } | { success: false; error: string }
> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    await db.delete(activity).where(eq(activity.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus aktivitas' };
  }
}
