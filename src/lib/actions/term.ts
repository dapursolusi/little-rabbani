'use server';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

import { db } from '@/lib/db';
import { kid, term, termSession } from '@/lib/db/schema';

import { requireOwner } from './utils';

// ─────────────── Term Validation ───────────────

const TermFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
});

export type TermFormData = z.infer<typeof TermFormSchema>;

// ─────────────── Term CRUD ───────────────

export async function getTerms() {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const terms = await db.query.term.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    with: {
      sessions: true,
    },
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
    with: {
      sessions: true,
    },
  });

  if (!result) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  return { success: true as const, data: result };
}

export async function createTerm(formData: FormData) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const rawData = Object.fromEntries(formData);
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

export async function updateTerm(id: string, formData: FormData) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const rawData = Object.fromEntries(formData);
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

  // Check for linked sessions
  const sessions = await db
    .select({ id: termSession.id })
    .from(termSession)
    .where(eq(termSession.termId, id));

  if (sessions.length > 0) {
    return {
      success: false as const,
      error: 'Hapus sesi terlebih dahulu',
    };
  }

  try {
    await db.delete(term).where(eq(term.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus term' };
  }
}

// ─────────────── Session Validation ───────────────

const SessionFormSchema = z.object({
  termId: z.string().min(1, 'Term wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  startTime: z.string().min(1, 'Jam mulai wajib diisi'),
  endTime: z.string().min(1, 'Jam selesai wajib diisi'),
  label: z.string().min(1, 'Label wajib diisi'),
  isHoliday: z.string().optional(),
  holidayReason: z.string().optional(),
});

export type SessionFormData = z.infer<typeof SessionFormSchema>;

// ─────────────── Session CRUD ───────────────

export async function getSessions(
  termId: string,
  params?: { search?: string; limit?: number; offset?: number }
) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const { search, limit = 50, offset = 0 } = params ?? {};

  const conditions = [eq(termSession.termId, termId)];
  if (search) {
    conditions.push(
      sql`(${termSession.label}::text ILIKE ${`%${search}%`} OR ${termSession.date}::text ILIKE ${`%${search}%`})`
    );
  }
  const where = and(...conditions);

  const [sessions, totalResult] = await Promise.all([
    db.query.termSession.findMany({
      where,
      orderBy: (ts, { asc }) => [asc(ts.date), asc(ts.startTime)],
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(termSession)
      .where(where),
  ]);

  const total = totalResult?.[0]?.count ?? 0;
  return { success: true as const, data: sessions, total };
}

export async function getSession(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const result = await db.query.termSession.findFirst({
    where: eq(termSession.id, id),
  });

  if (!result) {
    return { success: false as const, error: 'Sesi tidak ditemukan' };
  }

  return { success: true as const, data: result };
}

export async function createSession(formData: FormData) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = SessionFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const isHoliday = parsed.data.isHoliday === 'true';
    const [newSession] = await db
      .insert(termSession)
      .values({
        termId: parsed.data.termId,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        label: parsed.data.label,
        isHoliday,
        holidayReason: isHoliday ? (parsed.data.holidayReason ?? null) : null,
      })
      .returning();

    return { success: true as const, data: newSession };
  } catch {
    return { success: false as const, error: 'Gagal membuat sesi' };
  }
}

export async function updateSession(id: string, formData: FormData) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = SessionFormSchema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const isHoliday = parsed.data.isHoliday === 'true';
    const [updated] = await db
      .update(termSession)
      .set({
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        label: parsed.data.label,
        isHoliday,
        holidayReason: isHoliday ? (parsed.data.holidayReason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(termSession.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Sesi tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui sesi' };
  }
}

/**
 * VAL-MASTER-030: Holiday override on a Session marks is_holiday and blocks schedule.
 * VAL-MASTER-031: Removing holiday override unblocks the Session.
 */
export async function updateSessionHoliday(
  id: string,
  data: { isHoliday: boolean; holidayReason: string | null }
) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    const [updated] = await db
      .update(termSession)
      .set({
        isHoliday: data.isHoliday,
        holidayReason: data.isHoliday ? data.holidayReason : null,
        label: data.isHoliday
          ? (data.holidayReason ?? 'Hari Libur')
          : 'Hari Libur (dibatalkan)',
        updatedAt: new Date(),
      })
      .where(eq(termSession.id, id))
      .returning();

    if (!updated) {
      return { success: false as const, error: 'Sesi tidak ditemukan' };
    }

    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: 'Gagal memperbarui sesi' };
  }
}

export async function deleteSession(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    await db.delete(termSession).where(eq(termSession.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus sesi' };
  }
}

// ─────────────── Recurring Session Generation ───────────────

const DAYS_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * VAL-MASTER-027: Owner generates recurring Sessions from days-of-week.
 */
export async function generateRecurringSessions(
  termId: string,
  config: {
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
    label: string;
  }
) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const termRecord = await db.query.term.findFirst({
    where: eq(term.id, termId),
  });

  if (!termRecord) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  const startDate = new Date(termRecord.startDate);
  const endDate = new Date(termRecord.endDate);
  const selectedDays = config.daysOfWeek.map((d) => DAYS_MAP[d.toLowerCase()]);

  const datesToCreate: Array<{
    termId: string;
    date: string;
    startTime: string;
    endTime: string;
    label: string;
  }> = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (selectedDays.includes(dayOfWeek)) {
      datesToCreate.push({
        termId,
        date: current.toISOString().split('T')[0],
        startTime: config.startTime,
        endTime: config.endTime,
        label: config.label,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  if (datesToCreate.length === 0) {
    return {
      success: false as const,
      error:
        'Tidak ada sesi yang dihasilkan. Periksa rentang tanggal dan hari yang dipilih.',
    };
  }

  try {
    await db.insert(termSession).values(datesToCreate);
    return {
      success: true as const,
      data: { count: datesToCreate.length },
    };
  } catch {
    return {
      success: false as const,
      error: 'Gagal membuat sesi berulang',
    };
  }
}

// ─────────────── Cohort Assignment ───────────────

/**
 * VAL-MASTER-032: Owner assigns a Kid to a Term cohort (via enrolled_term_id).
 * This is handled in the kid update action already.
 * This function returns kids enrolled in a given term.
 */
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
