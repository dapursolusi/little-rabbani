'use server';

import { db } from '@/db';
import { kid, observation, reminderConfig } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

import { requireOwner } from './utils';

/**
 * Get the current Owner's reminder configuration.
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
 * Get total pending capture count across today's observations.
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
