'use server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { kid, observation, reminderConfig, termSession } from '@/lib/db/schema';

import { requireOwner } from './utils';

/**
 * Get the current Owner's reminder configuration.
 * Creates a default config if none exists.
 */
export async function getReminderConfig() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const existing = await db.query.reminderConfig.findFirst({
    where: eq(reminderConfig.userId, auth.userId),
  });

  if (!existing) {
    const [config] = await db
      .insert(reminderConfig)
      .values({
        userId: auth.userId,
        captureReminderEnabled: true,
        scheduleReminderEnabled: true,
      })
      .returning();

    return { success: true as const, data: config };
  }

  return { success: true as const, data: existing };
}

/**
 * Toggle capture-pending reminders on/off.
 * VAL-REMIN-003
 */
export async function toggleCaptureReminder(enabled: boolean) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const existing = await db.query.reminderConfig.findFirst({
    where: eq(reminderConfig.userId, auth.userId),
  });

  if (existing) {
    await db
      .update(reminderConfig)
      .set({ captureReminderEnabled: enabled, updatedAt: new Date() })
      .where(eq(reminderConfig.userId, auth.userId));
  } else {
    await db.insert(reminderConfig).values({
      userId: auth.userId,
      captureReminderEnabled: enabled,
      scheduleReminderEnabled: true,
    });
  }

  return { success: true as const, data: undefined };
}

/**
 * Toggle schedule-entry reminders on/off.
 * VAL-REMIN-004
 */
export async function toggleScheduleReminder(enabled: boolean) {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const existing = await db.query.reminderConfig.findFirst({
    where: eq(reminderConfig.userId, auth.userId),
  });

  if (existing) {
    await db
      .update(reminderConfig)
      .set({ scheduleReminderEnabled: enabled, updatedAt: new Date() })
      .where(eq(reminderConfig.userId, auth.userId));
  } else {
    await db.insert(reminderConfig).values({
      userId: auth.userId,
      captureReminderEnabled: true,
      scheduleReminderEnabled: enabled,
    });
  }

  return { success: true as const, data: undefined };
}

/**
 * Get total pending capture count across today's sessions.
 * Used for the in-app fallback badge when notifications are denied.
 * VAL-REMIN-011, VAL-REMIN-018
 */
export async function getOwnerPendingCaptureCount() {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return { success: false as const, error: auth.error };
  }

  const activeTerm = await db.query.term.findFirst({
    where: (term, { eq }) => eq(term.isActive, true),
  });

  if (!activeTerm) return { success: true as const, data: 0 };

  const enrolledKids = await db
    .select({ id: kid.id })
    .from(kid)
    .where(
      and(eq(kid.enrolledTermId, activeTerm.id), eq(kid.status, 'enrolled'))
    );

  if (enrolledKids.length === 0) return { success: true as const, data: 0 };

  const enrolledKidIds = enrolledKids.map((k) => k.id);
  const today = new Date().toISOString().split('T')[0];

  const todaySessions = await db.query.termSession.findMany({
    where: and(eq(termSession.date, today), eq(termSession.isHoliday, false)),
  });

  if (todaySessions.length === 0) return { success: true as const, data: 0 };

  let totalPending = 0;

  for (const session of todaySessions) {
    const observedKids = await db
      .select({ kidId: observation.kidId })
      .from(observation)
      .where(
        and(
          eq(observation.date, session.date),
          inArray(observation.kidId, enrolledKidIds)
        )
      );

    const observedCount = observedKids.length;
    totalPending += Math.max(0, enrolledKids.length - observedCount);
  }

  return { success: true as const, data: totalPending };
}
