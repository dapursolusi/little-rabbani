'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod/v4';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  dailyClassReport,
  dcrActivity,
  idempotencyKey as idempotencyKeyTable,
  kid,
  observation,
  observationActivity,
  observationNote,
  termSession,
} from '@/lib/db/schema';

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
  sessionId: z.string().min(1, 'Sesi wajib dipilih'),
  mood: MoodSchema,
  appetite: AppetiteSchema,
  presence: PresenceSchema,
  absenceReason: AbsenceReasonSchema.optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  idempotencyKey: z.string().optional().or(z.literal('')),
  version: z.coerce.number().int().optional(), // client-provided version for optimistic locking
});

const Pass2ActivitySchema = z.object({
  dcrActivityId: z.string().min(1),
  participated: z.enum(['yes', 'no']),
});

const SavePass2Schema = z.object({
  kidId: z.string().min(1, 'Anak wajib dipilih'),
  sessionId: z.string().min(1, 'Sesi wajib dipilih'),
  activities: z.string().min(2, 'Aktivitas wajib diisi'), // JSON string
});

// ─────────────── Helpers ───────────────

/**
 * Check if session exists, is not holiday, and has started.
 */
async function validateSessionForCapture(
  sessionId: string
): Promise<
  | { valid: true; session: typeof termSession.$inferSelect }
  | { valid: false; error: string }
> {
  const session = await db.query.termSession.findFirst({
    where: eq(termSession.id, sessionId),
  });

  if (!session) {
    return { valid: false, error: 'Sesi tidak ditemukan' };
  }

  // VAL-CAPTURE-028: Block capture on holiday session
  if (session.isHoliday) {
    return {
      valid: false,
      error: 'Sesi ini adalah hari libur — tidak dapat melakukan capture',
    };
  }

  // VAL-CAPTURE-052: Block capture before session starts
  const sessionStart = new Date(`${session.date}T${session.startTime}`);
  const now = new Date();
  if (now < sessionStart) {
    return {
      valid: false,
      error: 'Sesi belum dimulai — capture belum tersedia',
    };
  }

  return { valid: true, session };
}

/**
 * Require the current user to be a Teacher.
 * Redirects to login if unauthenticated, returns error if not Owner or Teacher.
 * Both Owners and Teachers can access capture (Owners can also test).
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
 * Get all sessions available for teacher capture view.
 * Only shows sessions from active terms.
 * Accessible by both Teacher and Owner.
 */
export async function getTeacherSessions() {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const sessions = await db.query.termSession.findMany({
    orderBy: [asc(termSession.date), asc(termSession.startTime)],
    with: {
      term: true,
    },
  });

  return { success: true as const, data: sessions };
}

/**
 * Get session with enrolled kids and their capture states.
 * VAL-CAPTURE-017: Teacher sees roster with per-kid capture state.
 * VAL-CAPTURE-027: Empty roster for no enrolled kids.
 * VAL-CAPTURE-028: Holiday blocked.
 * VAL-CAPTURE-022: Available anytime post-class.
 * VAL-CAPTURE-052: Blocked before session start.
 */
export async function getSessionWithKids(sessionId: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  // Validate session (holiday, start time)
  const validation = await validateSessionForCapture(sessionId);
  if (!validation.valid) {
    return { success: false as const, error: validation.error };
  }

  const { session } = validation;

  // Get term to find enrolled kids
  const termData = await db.query.term.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.id, session.termId),
  });

  if (!termData) {
    return { success: false as const, error: 'Term tidak ditemukan' };
  }

  // Get enrolled kids for this term
  const kids = await db.query.kid.findMany({
    where: (fields, { eq: eqOp, and: andOp }) =>
      andOp(
        eqOp(fields.enrolledTermId, termData.id),
        eqOp(fields.status, 'enrolled')
      ),
    with: {
      guardian: true,
    },
    orderBy: [asc(kid.name)],
  });

  // Get existing observations for this session
  const existingObservations = await db.query.observation.findMany({
    where: eq(observation.sessionId, sessionId),
    with: {
      notes: true,
    },
  });

  // Build capture state map
  const observationMap = new Map(
    existingObservations.map((obs) => [obs.kidId, obs])
  );

  // Attach capture state
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
      session,
      kids: kidsWithState,
    },
  };
}

/**
 * Get Pass 2 lock status for a session.
 * VAL-CAPTURE-023: Locked when DCR not captured.
 * VAL-CAPTURE-024: Unlocked when DCR captured.
 */
export async function getPass2Status(sessionId: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const dcr = await db.query.dailyClassReport.findFirst({
    where: eq(dailyClassReport.sessionId, sessionId),
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
 * VAL-CAPTURE-014: Unplanned activities flow into Pass 2.
 * VAL-CAPTURE-025: Teacher captures yes/no per activity.
 */
export async function getPass2Activities(sessionId: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  // Get the DCR for this session
  const dcr = await db.query.dailyClassReport.findFirst({
    where: eq(dailyClassReport.sessionId, sessionId),
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
 * Get existing observation for a kid in a session (for editing).
 */
export async function getKidObservation(kidId: string, sessionId: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const obs = await db.query.observation.findFirst({
    where: and(
      eq(observation.kidId, kidId),
      eq(observation.sessionId, sessionId)
    ),
    with: {
      notes: true,
    },
  });

  return { success: true as const, data: obs ?? null };
}

/**
 * Get existing Pass 2 activities for a kid in a session.
 */
export async function getKidPass2Activities(kidId: string, sessionId: string) {
  const auth = await requireTeacher();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const obs = await db.query.observation.findFirst({
    where: and(
      eq(observation.kidId, kidId),
      eq(observation.sessionId, sessionId)
    ),
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
 * VAL-CAPTURE-018: Captures mood, appetite, presence, notes.
 * VAL-CAPTURE-019: Mood validated 1-5.
 * VAL-CAPTURE-020: Appetite validated 3-level.
 * VAL-CAPTURE-021: Absence reason required when absent.
 * VAL-CAPTURE-030: Update existing observation (re-capture).
 * VAL-CAPTURE-051: Late/early_pickup presence handled.
 * VAL-CAPTURE-053: Notes append-only.
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

  const { kidId, sessionId, mood, appetite, presence, notes } = parsed.data;
  const absenceReason = parsed.data.absenceReason || null;
  const idempotencyKeyValue = parsed.data.idempotencyKey || null;
  // Client-provided version for optimistic locking (the version the client had when it loaded the data)
  const clientVersion = parsed.data.version;

  // VAL-CAPTURE-040: Check idempotency key for duplicate prevention
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

  // VAL-CAPTURE-021: Absence reason required when absent
  if (presence === 'absent' && !absenceReason) {
    return {
      success: false as const,
      error: 'Alasan ketidakhadiran wajib diisi',
    };
  }

  // Validate session
  const validation = await validateSessionForCapture(sessionId);
  if (!validation.valid) {
    return { success: false as const, error: validation.error };
  }

  try {
    // Check if observation already exists for this kid + session
    const existing = await db.query.observation.findFirst({
      where: and(
        eq(observation.kidId, kidId),
        eq(observation.sessionId, sessionId)
      ),
    });

    let obsId: string;
    let newVersion: number;

    if (existing) {
      // VAL-CAPTURE-030: Update existing observation (re-capture) with optimistic locking
      // Use the client-provided version in the WHERE clause, NOT the freshly-fetched DB version.
      // This ensures concurrent saves with stale versions return 409 conflict.
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

      // If no rows returned, version conflict
      if (!updated) {
        return {
          success: false as const,
          error: 'Data sudah diubah oleh pengguna lain. Silakan muat ulang.',
        };
      }

      obsId = existing.id;
    } else {
      // Create new observation
      newVersion = 0;
      const [created] = await db
        .insert(observation)
        .values({
          kidId,
          sessionId,
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

    // VAL-CAPTURE-053: Notes are append-only
    if (notes && notes.trim()) {
      await db.insert(observationNote).values({
        observationId: obsId,
        text: notes.trim(),
      });
    }

    // VAL-CAPTURE-040: Store idempotency key on successful save
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
 * VAL-CAPTURE-025: Yes/no per activity.
 * VAL-CAPTURE-026: Absent kids skip Pass 2.
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

  const { kidId, sessionId, activities: activitiesJson } = parsed.data;

  // Parse activities JSON
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
    // Find the observation (must exist - Pass 1 must be done first)
    const obs = await db.query.observation.findFirst({
      where: and(
        eq(observation.kidId, kidId),
        eq(observation.sessionId, sessionId)
      ),
    });

    if (!obs) {
      return {
        success: false as const,
        error:
          'Observasi Pass 1 belum dilakukan. Silakan isi Pass 1 terlebih dahulu.',
      };
    }

    // VAL-CAPTURE-026: Skip Pass 2 for absent kids
    if (obs.presence === 'absent') {
      return {
        success: false as const,
        error: 'Anak tidak hadir — partisipasi tidak diperlukan',
      };
    }

    // Delete existing observation activities for this observation
    await db
      .delete(observationActivity)
      .where(eq(observationActivity.observationId, obs.id));

    // Insert new activities
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
 * Get the total count of kids with pending (uncaptured) observations
 * across today's sessions for the Teacher dashboard banner.
 * Only considers non-holiday sessions from the active term.
 *
 * VAL-REMIN-005: Teacher sees pending capture count on dashboard.
 * VAL-REMIN-007: Count decreases as captures complete.
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

  // Get today's non-holiday sessions from the active term
  const todaySessions = await db.query.termSession.findMany({
    where: (session, { eq, and }) =>
      and(
        eq(session.date, today),
        eq(session.termId, activeTerm.id),
        eq(session.isHoliday, false)
      ),
  });

  if (todaySessions.length === 0) return { success: true as const, data: 0 };

  // Get enrolled kids for the active term
  const enrolledKids = await db.query.kid.findMany({
    where: (kid, { eq, and }) =>
      and(eq(kid.enrolledTermId, activeTerm.id), eq(kid.status, 'enrolled')),
  });

  if (enrolledKids.length === 0) return { success: true as const, data: 0 };

  const enrolledKidIds = enrolledKids.map((k) => k.id);

  let totalPending = 0;

  for (const session of todaySessions) {
    // Count how many enrolled kids already have observations for this session
    const observedKids = await db
      .select({ kidId: observation.kidId })
      .from(observation)
      .where(
        and(
          eq(observation.sessionId, session.id),
          inArray(observation.kidId, enrolledKidIds)
        )
      );

    const observedCount = observedKids.length;
    totalPending += Math.max(0, enrolledKids.length - observedCount);
  }

  return { success: true as const, data: totalPending };
}
