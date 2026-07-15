'use server';

import { KidFormSchema } from '@/features/kid/schema';
import { and, eq, ilike, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { kid, term } from '@/lib/db/schema';

import { requireOwner } from './utils';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  waiting: ['enrolled'],
  enrolled: ['alumni'],
  alumni: ['enrolled'], // Owner override only
};

export async function getKids(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const { search, limit = 50, offset = 0 } = params ?? {};

  const conditions = search ? [ilike(kid.name, `%${search}%`)] : [];

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [kids, totalResult] = await Promise.all([
    db.query.kid.findMany({
      where,
      with: {
        guardian: true,
        enrolledTerm: true,
      },
      orderBy: (kid, { asc }) => [asc(kid.name)],
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(kid)
      .where(where),
  ]);

  const total = totalResult?.[0]?.count ?? 0;

  return { success: true as const, data: kids, total };
}

export async function getKid(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const result = await db.query.kid.findFirst({
    where: eq(kid.id, id),
    with: {
      guardian: true,
      enrolledTerm: true,
    },
  });

  if (!result) {
    return { success: false as const, error: 'Murid tidak ditemukan' };
  }

  return { success: true as const, data: result };
}

export async function getActiveTerm() {
  const activeTerm = await db.query.term.findFirst({
    where: eq(term.isActive, true),
  });
  return activeTerm ?? null;
}

export async function createKid(formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = KidFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { status, enrolledTermId, ...data } = parsed.data;

  // If enrolling, require active term
  if (status === 'enrolled') {
    const activeTerm = await getActiveTerm();
    if (!activeTerm) {
      return {
        success: false as const,
        error: 'Aktifkan term terlebih dahulu',
      };
    }
  }

  try {
    const [newKid] = await db
      .insert(kid)
      .values({
        ...data,
        status,
        enrolledTermId:
          enrolledTermId && status === 'enrolled' ? enrolledTermId : null,
      })
      .returning();

    return { success: true as const, data: newKid };
  } catch {
    return { success: false as const, error: 'Gagal membuat murid' };
  }
}

export async function updateKid(id: string, formData: FormData) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = KidFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { status, enrolledTermId, ...data } = parsed.data;

  // Get current kid to check status transition validity
  const currentKid = await db.query.kid.findFirst({
    where: eq(kid.id, id),
  });

  if (!currentKid) {
    return { success: false as const, error: 'Murid tidak ditemukan' };
  }

  // Validate status transition
  if (currentKid.status !== status) {
    const allowedNext = STATUS_TRANSITIONS[currentKid.status];

    if (!allowedNext) {
      return { success: false as const, error: 'Status tidak dapat diubah' };
    }

    const isAllowed = allowedNext.includes(status);

    if (!isAllowed) {
      if (
        (currentKid.status === 'enrolled' && status === 'waiting') ||
        (currentKid.status === 'alumni' && status === 'waiting')
      ) {
        return {
          success: false as const,
          error:
            'Status tidak bisa mundur. Hanya bisa maju: waiting → enrolled → alumni',
        };
      }
      return { success: false as const, error: 'Transisi status tidak valid' };
    }
  }

  // If enrolling, require active term
  if (status === 'enrolled') {
    const activeTerm = await getActiveTerm();
    if (!activeTerm) {
      return {
        success: false as const,
        error: 'Aktifkan term terlebih dahulu',
      };
    }
  }

  try {
    const [updated] = await db
      .update(kid)
      .set({
        ...data,
        status,
        enrolledTermId:
          status === 'enrolled' && enrolledTermId ? enrolledTermId : null,
        updatedAt: new Date(),
      })
      .where(eq(kid.id, id))
      .returning();

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui murid' };
  }
}

export async function deleteKid(id: string) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  try {
    await db.delete(kid).where(eq(kid.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus murid' };
  }
}
