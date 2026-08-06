'use server';

import { db } from '@/db';
import { curriculum, dailyClassReport, term } from '@/db/schema';
import {
  type CurriculumPlanView,
  buildPlanView,
} from '@/features/curriculum/plan-view';
import type { Curriculum } from '@/features/curriculum/types';
import { getHolidays } from '@/features/holiday/actions';
import { getSessionTypes } from '@/features/sessionType/actions';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { requireOwner } from '@/lib/actions/utils';

// ──────── Batch Create ────────

import { CurriculumItemSchema } from './schema';

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
      where: and(eq(curriculum.id, id), isNull(curriculum.deletedAt)),
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

// ──────── Plan View (calendar display) ────────

export async function getCurriculumPlanView(): Promise<
  | { success: true; data: CurriculumPlanView }
  | { success: false; error: string }
> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const [termsResult, holidaysResult, sessionTypesResult] = await Promise.all(
      [
        db.query.term.findMany({
          where: isNull(term.deletedAt),
          orderBy: (t, { asc }) => [asc(t.startDate)],
        }),
        getHolidays(),
        getSessionTypes(),
      ]
    );

    const terms = termsResult;
    const holidays = holidaysResult.success ? holidaysResult.data : [];
    const hasActiveSessionType = sessionTypesResult.success
      ? sessionTypesResult.data.length > 0
      : false;

    const curriculumByTerm: Record<string, Curriculum[]> = {};
    for (const t of terms) {
      const result = await getCurriculum(t.id);
      if (result.success) curriculumByTerm[t.id] = result.data;
    }

    const data = buildPlanView({
      terms: terms.map((t) => ({
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        isActive: t.isActive,
      })),
      holidays,
      hasActiveSessionType,
      curriculumByTerm,
    });

    return { success: true as const, data };
  } catch {
    return {
      success: false as const,
      error: 'Gagal memuat tampilan kurikulum',
    };
  }
}

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
    // Compute starting sort_order server-side to avoid client-racing on concurrent creates.
    const [maxRow] = await db
      .select({
        maxSort: sql<number>`COALESCE(MAX(${curriculum.sortOrder}), -1)`,
      })
      .from(curriculum)
      .where(
        and(
          eq(curriculum.termId, inputs[0].termId),
          isNull(curriculum.deletedAt)
        )
      );

    const startSort = (maxRow?.maxSort ?? -1) + 1;

    const created = await db
      .insert(curriculum)
      .values(
        inputs.map((i, idx) => ({
          termId: i.termId,
          sortOrder: startSort + idx,
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

  const parsed = CurriculumItemSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [updated] = await db
      .update(curriculum)
      .set({
        subThemeId: parsed.data.subThemeId,
        name: parsed.data.name,
        objective: parsed.data.objective ?? null,
        indoor: parsed.data.indoor === 'true',
        itemsToBring: parsed.data.itemsToBring ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(curriculum.id, id), isNull(curriculum.deletedAt)))
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

  // Check if any DCR references this curriculum item
  const referencingDcrs = await db.query.dailyClassReport.findMany({
    where: and(
      eq(dailyClassReport.curriculumId, id),
      isNull(dailyClassReport.deletedAt)
    ),
    columns: { id: true },
    limit: 1,
  });

  if (referencingDcrs.length > 0) {
    return {
      success: false as const,
      error:
        'Item kurikulum tidak dapat dihapus karena sudah digunakan oleh laporan harian kelas.',
    };
  }

  try {
    await db
      .update(curriculum)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(curriculum.id, id), isNull(curriculum.deletedAt)));

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
    const item = await db.query.curriculum.findFirst({
      where: and(eq(curriculum.id, id), isNull(curriculum.deletedAt)),
    });
    if (!item) {
      return { success: false as const, error: 'Item tidak ditemukan' };
    }

    // Check if any DCR references this curriculum item
    const referencingDcrs = await db.query.dailyClassReport.findMany({
      where: and(
        eq(dailyClassReport.curriculumId, id),
        isNull(dailyClassReport.deletedAt)
      ),
      columns: { id: true },
      limit: 1,
    });

    if (referencingDcrs.length > 0) {
      return {
        success: false as const,
        error:
          'Item kurikulum tidak dapat diubah urutannya karena sudah digunakan oleh laporan harian kelas.',
      };
    }

    // Swap sort_order with the adjacent item
    await db.transaction(async (tx) => {
      await tx
        .update(curriculum)
        .set({ sortOrder: newSortOrder, updatedAt: new Date() })
        .where(eq(curriculum.id, id));

      await tx
        .update(curriculum)
        .set({
          sortOrder: item.sortOrder,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(curriculum.sortOrder, newSortOrder),
            eq(curriculum.termId, item.termId),
            isNull(curriculum.deletedAt)
            // ponytail: no unique constraint on sortOrder per term.
            // A swap is atomic in the tx. If the "adjacent" item was already
            // reordered by a concurrent call, this UPDATE sets it to the old
            // sortOrder of this item, which is still a valid number. Worst
            // case: two items share the same sortOrder until manually fixed.
            // Upgrade to an optimistic-lock or queue-based reorder when
            // concurrent owner edits are a real pattern.
          )
        );
    });

    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal mengubah urutan' };
  }
}
