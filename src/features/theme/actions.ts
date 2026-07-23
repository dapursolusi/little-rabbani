'use server';

import { db } from '@/db';
import { subTheme, theme } from '@/db/schema';
import { SubThemeFormSchema, ThemeFormSchema } from '@/features/theme/schema';
import { and, eq, ilike, isNull, sql } from 'drizzle-orm';

import { requireOwner } from '../../lib/actions/utils';

// ──────── Theme types ────────

type ThemeActionResult =
  | { success: true; data: typeof theme.$inferSelect }
  | { success: false; error: string };

// ──────── Theme actions ────────

export async function getThemes(params?: {
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
    const conditions = [isNull(theme.deletedAt)];
    if (search) conditions.push(ilike(theme.name, `%${search}%`));
    const where = and(...conditions);

    const [items, totalResult] = await Promise.all([
      db.query.theme.findMany({
        where,
        orderBy: (t, { asc }) => [asc(t.name)],
        limit,
        offset,
        with: { subThemes: true },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(theme)
        .where(where),
    ]);

    const total = totalResult?.[0]?.count ?? 0;

    return { success: true as const, data: items, total };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data tema' };
  }
}

export async function getTheme(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const result = await db.query.theme.findFirst({
      where: eq(theme.id, id),
    });

    if (!result) {
      return { success: false as const, error: 'Tema tidak ditemukan' };
    }

    return { success: true as const, data: result };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data tema' };
  }
}

export async function createTheme(
  input: Record<string, unknown>
): Promise<ThemeActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = ThemeFormSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newItem] = await db.insert(theme).values(parsed.data).returning();

    return { success: true as const, data: newItem };
  } catch {
    return { success: false as const, error: 'Gagal membuat tema' };
  }
}

export async function updateTheme(
  id: string,
  input: Record<string, unknown>
): Promise<ThemeActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = ThemeFormSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [updated] = await db
      .update(theme)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(theme.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Tema tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui tema' };
  }
}

export async function deleteTheme(id: string): Promise<ThemeActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const [updated] = await db
      .update(theme)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(theme.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Tema tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal menghapus tema' };
  }
}

export async function getActiveThemes() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const items = await db.query.theme.findMany({
      where: isNull(theme.deletedAt),
      orderBy: (t, { asc }) => [asc(t.name)],
    });

    return { success: true as const, data: items };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data tema' };
  }
}

// ──────── SubTheme types ────────

type SubThemeActionResult =
  | { success: true; data: typeof subTheme.$inferSelect }
  | { success: false; error: string };

// ──────── SubTheme actions ────────

export async function getSubThemes(params?: { themeId?: string }) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const { themeId } = params ?? {};

  try {
    const conditions = [isNull(subTheme.deletedAt)];
    if (themeId) {
      conditions.push(eq(subTheme.themeId, themeId));
    }

    const items = await db.query.subTheme.findMany({
      where: and(...conditions),
      with: { theme: true },
      orderBy: (st, { asc }) => [asc(st.name)],
    });

    return { success: true as const, data: items };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data sub tema' };
  }
}

export async function getSubTheme(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const result = await db.query.subTheme.findFirst({
      where: eq(subTheme.id, id),
    });

    if (!result) {
      return { success: false as const, error: 'Sub tema tidak ditemukan' };
    }

    return { success: true as const, data: result };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data sub tema' };
  }
}

export async function createSubTheme(
  input: Record<string, unknown>
): Promise<SubThemeActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = SubThemeFormSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newItem] = await db.insert(subTheme).values(parsed.data).returning();

    return { success: true as const, data: newItem };
  } catch {
    return { success: false as const, error: 'Gagal membuat sub tema' };
  }
}

export async function updateSubTheme(
  id: string,
  input: Record<string, unknown>
): Promise<SubThemeActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const parsed = SubThemeFormSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [updated] = await db
      .update(subTheme)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(subTheme.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Sub tema tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui sub tema' };
  }
}

export async function deleteSubTheme(
  id: string
): Promise<SubThemeActionResult> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    const [updated] = await db
      .update(subTheme)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(subTheme.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Sub tema tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal menghapus sub tema' };
  }
}

export async function getActiveSubThemes(params?: { themeId?: string }) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const { themeId } = params ?? {};

  try {
    const conditions = [isNull(subTheme.deletedAt)];
    if (themeId) {
      conditions.push(eq(subTheme.themeId, themeId));
    }

    const items = await db.query.subTheme.findMany({
      where: and(...conditions),
      orderBy: (st, { asc }) => [asc(st.name)],
    });

    return { success: true as const, data: items };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data sub tema' };
  }
}
