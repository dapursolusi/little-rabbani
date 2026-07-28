'use server';

import { db } from '@/db';
import { curriculum } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

import { requireOwner } from '@/lib/actions/utils';

// ──────── Read ────────

export async function getCurriculum(termId: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const items = await db.query.curriculum.findMany({
      where: and(eq(curriculum.termId, termId), isNull(curriculum.deletedAt)),
      with: { subTheme: { with: { theme: true } } },
      orderBy: (c, { asc }) => [asc(c.sortOrder)],
    });

    return { success: true as const, data: items };
  } catch {
    return { success: false as const, error: 'Gagal mengambil kurikulum' };
  }
}

export async function getCurriculumItem(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const item = await db.query.curriculum.findFirst({
      where: eq(curriculum.id, id),
    });

    if (!item) {
      return {
        success: false as const,
        error: 'Item kurikulum tidak ditemukan',
      };
    }

    return { success: true as const, data: item };
  } catch {
    return { success: false as const, error: 'Gagal mengambil item kurikulum' };
  }
}

// ──────── Batch Create ────────

export type CreateCurriculumInput = {
  termId: string;
  sortOrder: number;
  subThemeId: string;
  name: string;
  objective?: string | null;
  indoor?: boolean;
  itemsToBring?: string | null;
};

export async function createCurriculumItems(inputs: CreateCurriculumInput[]) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  if (inputs.length === 0) {
    return {
      success: false as const,
      error: 'Tidak ada item yang ditambahkan',
    };
  }

  try {
    const created = await db
      .insert(curriculum)
      .values(
        inputs.map((i) => ({
          termId: i.termId,
          sortOrder: i.sortOrder,
          subThemeId: i.subThemeId,
          name: i.name,
          objective: i.objective ?? null,
          indoor: i.indoor ?? false,
          itemsToBring: i.itemsToBring ?? null,
        }))
      )
      .returning();

    return { success: true as const, data: created };
  } catch {
    return { success: false as const, error: 'Gagal menambahkan kurikulum' };
  }
}

// ──────── Single Update ────────

export async function updateCurriculumItem(
  id: string,
  data: Record<string, unknown>
) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const [updated] = await db
      .update(curriculum)
      .set({
        subThemeId: data.subThemeId as string,
        name: data.name as string,
        objective: (data.objective as string) ?? null,
        indoor: (data.indoor === 'true') as boolean,
        itemsToBring: (data.itemsToBring as string) ?? null,
        updatedAt: new Date(),
      })
      .where(eq(curriculum.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Item tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui item' };
  }
}

// ──────── Delete (soft) ────────

export async function deleteCurriculumItem(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    await db
      .update(curriculum)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(curriculum.id, id));

    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus item' };
  }
}

// ──────── Reorder (swap sort order with adjacent item) ────────

export async function reorderCurriculumItem(id: string, newSortOrder: number) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const [updated] = await db
      .update(curriculum)
      .set({ sortOrder: newSortOrder, updatedAt: new Date() })
      .where(eq(curriculum.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Item tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal mengubah urutan' };
  }
}
