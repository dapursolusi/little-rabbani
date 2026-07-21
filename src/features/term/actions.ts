'use server';

import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/lib/db';
import { kid, term } from '@/lib/db/schema';

import { requireOwner } from '../../lib/actions/utils';
import { TermFormSchema } from './schema';

// ─────────────── Term CRUD ───────────────

export async function getTerms() {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const terms = await db.query.term.findMany({
    where: isNull(term.deletedAt),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return { success: true as const, data: terms };
}

export async function getTerm(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const result = await db.query.term.findFirst({
    where: eq(term.id, id),
  });

  if (!result) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  return { success: true as const, data: result };
}

export async function createTerm(input: FormData | Record<string, unknown>) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const rawData = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = TermFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newTerm] = await db
      .insert(term)
      .values({
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
      })
      .returning();

    return { success: true as const, data: newTerm };
  } catch {
    return { success: false as const, error: 'Gagal membuat term' };
  }
}

export async function updateTerm(
  id: string,
  input: FormData | Record<string, unknown>
) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const rawData = input instanceof FormData ? Object.fromEntries(input) : input;
  const parsed = TermFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [updated] = await db
      .update(term)
      .set({
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        updatedAt: new Date(),
      })
      .where(eq(term.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Term tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui term' };
  }
}

/**
 * Activate a term. Only one term can be active at a time.
 * VAL-MASTER-020: Owner sets a Term as active.
 * VAL-MASTER-021: Only one Term can be active at a time.
 */
export async function activateTerm(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    // Deactivate all currently active terms
    const activeTerms = await db
      .select({ id: term.id })
      .from(term)
      .where(eq(term.isActive, true));

    for (const active of activeTerms) {
      await db
        .update(term)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(term.id, active.id));
    }

    // Activate the target term
    const [updated] = await db
      .update(term)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(term.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Term tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal mengaktifkan term' };
  }
}

/**
 * VAL-MASTER-023: Owner deletes a Term (with no sessions).
 * VAL-MASTER-024: Owner cannot delete a Term with sessions.
 */
export async function deleteTerm(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    await db.update(term).set({ deletedAt: new Date() }).where(eq(term.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus term' };
  }
}

// ─────────────── Cohort Assignment ───────────────

export async function getTermCohort(termId: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const enrolledKids = await db.query.kid.findMany({
    where: eq(kid.enrolledTermId, termId),
    with: {
      guardian: true,
    },
    orderBy: (k, { asc }) => [asc(k.name)],
  });

  return { success: true as const, data: enrolledKids };
}

/**
 * VAL-MASTER-034: Owner bulk-enrolls waiting-list Kids into a Term.
 */
export async function bulkEnrollKids(termId: string, kidIds: string[]) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  if (kidIds.length === 0) {
    return { success: false as const, error: 'Pilih murid terlebih dahulu' };
  }

  // Verify term exists and is active
  const termRecord = await db.query.term.findFirst({
    where: eq(term.id, termId),
  });

  if (!termRecord) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  if (!termRecord.isActive) {
    return {
      success: false as const,
      error: 'Aktifkan term terlebih dahulu',
    };
  }

  try {
    await db
      .update(kid)
      .set({
        status: 'enrolled',
        enrolledTermId: termId,
        updatedAt: new Date(),
      })
      .where(and(eq(kid.status, 'waiting'), inArray(kid.id, kidIds)));

    return {
      success: true as const,
      data: { count: kidIds.length },
    };
  } catch {
    return {
      success: false as const,
      error: 'Gagal mendaftarkan murid',
    };
  }
}

/**
 * Get waiting-list kids for a given term (kids with status=waiting).
 */
export async function getWaitingListKids() {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const waitingKids = await db.query.kid.findMany({
    where: eq(kid.status, 'waiting'),
    with: {
      guardian: true,
    },
    orderBy: (k, { asc }) => [asc(k.name)],
  });

  return { success: true as const, data: waitingKids };
}
