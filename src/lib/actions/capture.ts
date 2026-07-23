'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { db } from '@/db';
import {
  dailyClassReport,
  dcrActivity,
  idempotencyKey as idempotencyKeyTable,
  kid,
  observation,
  observationActivity,
  observationNote,
  sessionType,
} from '@/db/schema';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod/v4';

import { auth } from '@/lib/auth';

// ─────────────── Zod Schemas ───────────────

const MoodSchema = z.coerce.number().int().min(1).max(5);
const AppetiteSchema = z.enum(['good', 'moderate', 'poor']);
const PresenceSchema = z.enum([
  'present_full',
  'late',
  'early_pickup',
  'absent',
]);
const AbsenceReasonSchema = z.enum(['sick', 'family', 'permission', 'other']);

const SavePass1Schema = z.object({
  kidId: z.string().min(1, 'Anak wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  mood: MoodSchema,
  appetite: AppetiteSchema,
  presence: PresenceSchema,
  absenceReason: AbsenceReasonSchema.optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  idempotencyKey: z.string().optional().or(z.literal('')),
  version: z.coerce.number().int().optional(),
});

const Pass2ActivitySchema = z.object({
  dcrActivityId: z.string().min(1),
  participated: z.enum(['yes', 'no']),
});

const SavePass2Schema = z.object({
  kidId: z.string().min(1, 'Anak wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  activities: z.string().min(2, 'Aktivitas wajib diisi'),
});

// ─────────────── Helpers ───────────────

/**
 * Require the current user to be a Teacher.
 */
async function requireTeacher(): Promise<
  { authorized: true; userId: string } | { authorized: false; error: string }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
    return { authorized: false, error: 'Redirecting...' };
  }
  if (session.user.role !== 'teacher' && session.user.role !== 'owner') {
    return {
      authorized: false,
      error: 'Akses ditolak.',
    };
  }

  return { authorized: true, userId: session.user.id };
}

// ─────────────── Read Operations ───────────────

/**
 * Get session info for the teacher capture view.
 * Returns session type and enrolled kids with capture states.
 */
export async function getSessionWithKids(date: string, sessionTypeId: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  // Find active session type
  const st = await db.query.sessionType.findFirst({
    where: and(
      eq(sessionType.id, sessionTypeId),
      eq(sessionType.active, true),
      isNull(sessionType.deletedAt)
    ),
  });

  if (!st) {
    return { success: false as const, error: 'Tipe sesi tidak ditemukan' };
  }

  // Find active term
  const activeTerm = await db.query.term.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.isActive, true),
  });

  if (!activeTerm) {
    return { success: false as const, error: 'Tidak ada term aktif' };
  }

  // Get enrolled kids for the active term
  const kids = await db.query.kid.findMany({
    where: (fields, { eq: eqOp, and: andOp }) =>
      andOp(
        eqOp(fields.enrolledTermId, activeTerm.id),
        eqOp(fields.status, 'enrolled')
      ),
    with: {
      guardian: true,
    },
    orderBy: [asc(kid.name)],
  });

  // Get existing observations for this date
  const existingObservations = await db.query.observation.findMany({
    where: eq(observation.date, date),
    with: {
      notes: true,
    },
  });

  const observationMap = new Map(
    existingObservations.map((obs) => [obs.kidId, obs])
  );

  const kidsWithState = kids.map((k) => {
    const obs = observationMap.get(k.id);
    return {
      id: k.id,
      name: k.name,
      status: k.status,
      guardianId: k.guardianId,
      captureState: obs ? ('captured' as const) : ('uncaptured' as const),
      observation: obs ?? null,
    };
  });

  return {
    success: true as const,
    data: {
      date,
      sessionType: st,
      kids: kidsWithState,
    },
  };
}

/**
 * Get Pass 2 lock status for a date + sessionTypeId.
 */
export async function getPass2Status(date: string, sessionTypeId: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const dcr = await db.query.dailyClassReport.findFirst({
    where: and(
      eq(dailyClassReport.date, date),
      eq(dailyClassReport.sessionTypeId, sessionTypeId)
    ),
  });

  return {
    success: true as const,
    data: {
      isDcrCaptured: !!dcr,
      dcrId: dcr?.id ?? null,
    },
  };
}

/**
 * Get DCR activities for Pass 2.
 */
export async function getPass2Activities(date: string, sessionTypeId: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const dcr = await db.query.dailyClassReport.findFirst({
    where: and(
      eq(dailyClassReport.date, date),
      eq(dailyClassReport.sessionTypeId, sessionTypeId)
    ),
  });

  if (!dcr) {
    return { success: true as const, data: [] };
  }

  const activities = await db.query.dcrActivity.findMany({
    where: eq(dcrActivity.dcrId, dcr.id),
    orderBy: [asc(dcrActivity.createdAt)],
    with: {
      activity: true,
    },
  });

  return { success: true as const, data: activities };
}

/**
 * Get existing observation for a kid on a given date.
 */
export async function getKidObservation(kidId: string, date: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const obs = await db.query.observation.findFirst({
    where: and(eq(observation.kidId, kidId), eq(observation.date, date)),
    with: {
      notes: true,
    },
  });

  return { success: true as const, data: obs ?? null };
}

/**
 * Get existing Pass 2 activities for a kid on a given date.
 */
export async function getKidPass2Activities(kidId: string, date: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const obs = await db.query.observation.findFirst({
    where: and(eq(observation.kidId, kidId), eq(observation.date, date)),
  });

  if (!obs) {
    return { success: true as const, data: [] };
  }

  const activities = await db.query.observationActivity.findMany({
    where: eq(observationActivity.observationId, obs.id),
  });

  return { success: true as const, data: activities };
}

// ─────────────── Mutations ───────────────

/**
 * Save Pass 1 observation (create or update).
 */
export async function savePass1Observation(formData: FormData) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = SavePass1Schema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { kidId, date, mood, appetite, presence, notes } = parsed.data;
  const absenceReason = parsed.data.absenceReason || null;
  const idempotencyKeyValue = parsed.data.idempotencyKey || null;
  const clientVersion = parsed.data.version;

  // Idempotency check
  if (idempotencyKeyValue) {
    const existingKeys = await db
      .select()
      .from(idempotencyKeyTable)
      .where(eq(idempotencyKeyTable.key, idempotencyKeyValue))
      .limit(1);

    if (existingKeys.length > 0) {
      return {
        success: true as const,
        data: {
          id: existingKeys[0].id,
          version: 0,
          deduplicated: true,
        },
      };
    }
  }

  // Absence reason required when absent
  if (presence === 'absent' && !absenceReason) {
    return {
      success: false as const,
      error: 'Alasan ketidakhadiran wajib diisi',
    };
  }

  try {
    // Check if observation already exists for this kid + date
    const existing = await db.query.observation.findFirst({
      where: and(eq(observation.kidId, kidId), eq(observation.date, date)),
    });

    let obsId: string;
    let newVersion: number;

    // Resolve sessionTypeId from the date — use the active session type
    const st = await db.query.sessionType.findFirst({
      where: and(eq(sessionType.active, true), isNull(sessionType.deletedAt)),
    });

    if (!st) {
      return {
        success: false as const,
        error: 'Tidak ada tipe sesi aktif',
      };
    }

    if (existing) {
      const expectedVersion =
        clientVersion !== undefined ? clientVersion : existing.version;
      newVersion = expectedVersion + 1;

      const [updated] = await db
        .update(observation)
        .set({
          mood,
          appetite,
          presence,
          absenceReason,
          version: newVersion,
          capturedAt: new Date(),
          updatedAt: new Date(),
          teacherId: auth.userId,
        })
        .where(
          and(
            eq(observation.id, existing.id),
            eq(observation.version, expectedVersion)
          )
        )
        .returning();

      if (!updated) {
        return {
          success: false as const,
          error: 'Data sudah diubah oleh pengguna lain. Silakan muat ulang.',
        };
      }

      obsId = existing.id;
    } else {
      newVersion = 0;
      const [created] = await db
        .insert(observation)
        .values({
          kidId,
          date,
          sessionTypeId: st.id,
          teacherId: auth.userId,
          mood,
          appetite,
          presence,
          absenceReason,
          version: 0,
          capturedAt: new Date(),
        })
        .returning();

      obsId = created.id;
    }

    // Notes are append-only
    if (notes && notes.trim()) {
      await db.insert(observationNote).values({
        observationId: obsId,
        text: notes.trim(),
      });
    }

    if (idempotencyKeyValue) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      await db.insert(idempotencyKeyTable).values({
        key: idempotencyKeyValue,
        expiresAt: sevenDaysFromNow,
      });
    }

    return {
      success: true as const,
      data: { id: obsId, version: newVersion, deduplicated: false as const },
    };
  } catch (error) {
    console.error('Gagal menyimpan observasi:', error);
    return {
      success: false as const,
      error: 'Gagal menyimpan observasi',
    };
  }
}

/**
 * Save Pass 2 observation activities (participation).
 */
export async function savePass2Observation(formData: FormData) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const rawData = Object.fromEntries(formData);
  const parsed = SavePass2Schema.safeParse(rawData);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  const { kidId, date, activities: activitiesJson } = parsed.data;

  let activities: Array<{ dcrActivityId: string; participated: 'yes' | 'no' }>;
  try {
    const parsedActivities = JSON.parse(activitiesJson);
    const result = z.array(Pass2ActivitySchema).safeParse(parsedActivities);
    if (!result.success) {
      return { success: false as const, error: 'Data aktivitas tidak valid' };
    }
    activities = result.data;
  } catch {
    return { success: false as const, error: 'Data aktivitas tidak valid' };
  }

  try {
    const obs = await db.query.observation.findFirst({
      where: and(eq(observation.kidId, kidId), eq(observation.date, date)),
    });

    if (!obs) {
      return {
        success: false as const,
        error:
          'Observasi Pass 1 belum dilakukan. Silakan isi Pass 1 terlebih dahulu.',
      };
    }

    if (obs.presence === 'absent') {
      return {
        success: false as const,
        error: 'Anak tidak hadir — partisipasi tidak diperlukan',
      };
    }

    await db
      .delete(observationActivity)
      .where(eq(observationActivity.observationId, obs.id));

    if (activities.length > 0) {
      const values = activities.map((act) => ({
        observationId: obs.id,
        dcrActivityId: act.dcrActivityId,
        participated: act.participated,
      }));
      await db.insert(observationActivity).values(values);
    }

    return { success: true as const, data: { id: obs.id } };
  } catch (error) {
    console.error('Gagal menyimpan partisipasi:', error);
    return {
      success: false as const,
      error: 'Gagal menyimpan partisipasi',
    };
  }
}

// ─────────────── Teacher Pending Capture ───────────────

/**
 * Get the total count of kids with pending observations across today's sessions.
 */
export async function getTeacherPendingCaptureCount() {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const today = new Date().toISOString().split('T')[0];

  const activeTerm = await db.query.term.findFirst({
    where: (term, { eq }) => eq(term.isActive, true),
  });

  if (!activeTerm) return { success: true as const, data: 0 };

  const enrolledKids = await db.query.kid.findMany({
    where: (kid, { eq, and }) =>
      and(eq(kid.enrolledTermId, activeTerm.id), eq(kid.status, 'enrolled')),
  });

  if (enrolledKids.length === 0) return { success: true as const, data: 0 };

  const enrolledKidIds = enrolledKids.map((k) => k.id);

  // Count observed kids for today
  const observedKids = await db
    .select({ kidId: observation.kidId })
    .from(observation)
    .where(
      and(
        eq(observation.date, today),
        inArray(observation.kidId, enrolledKidIds)
      )
    );

  const totalPending = Math.max(0, enrolledKids.length - observedKids.length);

  return { success: true as const, data: totalPending };
}
