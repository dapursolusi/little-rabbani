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
import { listTermWorkdays } from '@/features/term/workdays';
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
  /** 0-based workday position. Optional when `date` is provided — the server
   *  derives it from the term's workday list. */
  sortOrder?: number;
  /** ISO date the item should land on. When present, the server resolves
   *  sortOrder = index of this date in the term's workday list, so the
   *  calendar date derives from the sequence (no date stored). */
  date?: string | null;
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
    // Items must all target the same term (a batch write is per-term).
    const termId = inputs[0].termId;
    const targetTerm = await db.query.term.findFirst({
      where: eq(term.id, termId),
    });
    if (!targetTerm) {
      return { success: false as const, error: 'Term tidak ditemukan' };
    }

    const [holidaysResult, sessionTypesResult] = await Promise.all([
      getHolidays(),
      getSessionTypes(),
    ]);
    const holidays = holidaysResult.success ? holidaysResult.data : [];
    const hasActiveSessionType = sessionTypesResult.success
      ? sessionTypesResult.data.length > 0
      : false;
    const workdays = listTermWorkdays(
      {
        startDate: targetTerm.startDate,
        endDate: targetTerm.endDate,
      },
      holidays.map((h) => ({ startDate: h.startDate, endDate: h.endDate })),
      hasActiveSessionType
    );

    // Resolve each input's sortOrder. A `date` places the item on that
    // workday (one item per workday); without one, fall back to appending
    // after the current max.
    const resolved = new Map<string, number>();
    const startSort = await (async () => {
      if (inputs.some((i) => !i.date)) {
        const [maxRow] = await db
          .select({
            maxSort: sql<number>`COALESCE(MAX(${curriculum.sortOrder}), -1)`,
          })
          .from(curriculum)
          .where(
            and(eq(curriculum.termId, termId), isNull(curriculum.deletedAt))
          );
        return (maxRow?.maxSort ?? -1) + 1;
      }
      return 0;
    })();

    let appended = 0;
    const sortOrders: number[] = [];
    for (const i of inputs) {
      if (i.date) {
        const idx = workdays.indexOf(i.date);
        if (idx === -1) {
          return {
            success: false as const,
            error:
              'Tanggal tidak termasuk hari aktif term — item tidak dapat ditempatkan',
          };
        }
        if (resolved.has(String(idx))) {
          return {
            success: false as const,
            error: 'Hanya satu aktivitas yang dapat dijadwalkan per hari',
          };
        }
        resolved.set(String(idx), idx);
        sortOrders.push(idx);
      } else {
        sortOrders.push(startSort + appended);
        appended += 1;
      }
    }

    const created = await db
      .insert(curriculum)
      .values(
        inputs.map((i, idx) => ({
          termId,
          sortOrder: sortOrders[idx],
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

// ──────── Batch Upsert ────────

export type BatchUpsertRow = {
  id?: string;
  sortOrder: number;
  subThemeId: string;
  name: string;
  objective?: string;
  indoor?: 'true' | 'false';
  itemsToBring?: string;
};

export async function batchUpsert(
  termId: string,
  rows: BatchUpsertRow[]
): Promise<
  | { success: true; data: { inserted: number; updated: number } }
  | { success: false; error: string }
> {
  const auth = await requireOwner();
  if (!auth.authorized) return { success: false as const, error: auth.error };

  if (rows.length === 0) {
    return { success: false as const, error: 'Tidak ada baris yang disimpan' };
  }

  // Validate each row once; keep parsed values so insert/update share them.
  const parsedRows: Array<{
    id?: string;
    sortOrder: number;
    data: {
      subThemeId: string;
      name: string;
      objective: string | null;
      indoor: boolean;
      itemsToBring: string | null;
    };
  }> = [];
  for (const r of rows) {
    const parsed = CurriculumItemSchema.safeParse(r);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
      return { success: false as const, error: firstError };
    }
    parsedRows.push({
      id: r.id,
      sortOrder: r.sortOrder,
      data: {
        subThemeId: parsed.data.subThemeId,
        name: parsed.data.name,
        objective: parsed.data.objective ?? null,
        indoor: parsed.data.indoor === 'true',
        itemsToBring: parsed.data.itemsToBring ?? null,
      },
    });
  }

  try {
    const existing = await db.query.curriculum.findMany({
      where: and(eq(curriculum.termId, termId), isNull(curriculum.deletedAt)),
      columns: { id: true, sortOrder: true },
    });
    const existingBySort: Record<number, string> = {};
    for (const e of existing) existingBySort[e.sortOrder] = e.id;

    const toInsert = parsedRows.filter(
      (r) => !(r.id ?? existingBySort[r.sortOrder])
    );
    const toUpdate = parsedRows.filter(
      (r) => r.id ?? existingBySort[r.sortOrder]
    );

    let inserted = 0;
    if (toInsert.length > 0) {
      await db.insert(curriculum).values(
        toInsert.map((r) => ({
          termId,
          sortOrder: r.sortOrder,
          ...r.data,
        }))
      );
      inserted = toInsert.length;
    }

    for (const u of toUpdate) {
      const id = u.id ?? existingBySort[u.sortOrder];
      await db
        .update(curriculum)
        .set({ ...u.data, updatedAt: new Date() })
        .where(
          and(
            eq(curriculum.id, id),
            eq(curriculum.termId, termId),
            isNull(curriculum.deletedAt)
          )
        );
    }

    return {
      success: true as const,
      data: { inserted, updated: toUpdate.length },
    };
  } catch {
    return { success: false as const, error: 'Gagal menyimpan kurikulum' };
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
