// Reminder processing logic
// Checks conditions and fires push notifications for:
// - Capture-pending: count pending observations for today
// - Schedule-entry: Thursday morning if next week's schedule is empty
import { db } from '@/db';
import {
  holiday,
  kid,
  observation,
  pushSubscription,
  reminderConfig,
  reminderLog,
  sessionType,
  user,
} from '@/db/schema';
import { and, eq, gte, inArray, isNull, lte } from 'drizzle-orm';

import { sendPushNotification } from './push';

// ============================================================
// Capture-Pending Reminder
// ============================================================

interface IPendingSession {
  sessionId: string;
  sessionLabel: string;
  sessionDate: string;
  endTime: string;
  pendingKidCount: number;
}

/**
 * Find today's active session types with pending observations.
 */
export async function findPendingCaptureSessions(): Promise<IPendingSession[]> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const activeTypes = await db.query.sessionType.findMany({
    where: and(eq(sessionType.active, true), isNull(sessionType.deletedAt)),
  });

  if (activeTypes.length === 0) return [];

  const eligibleSessions: IPendingSession[] = [];

  // Find the active term
  const activeTerm = await db.query.term.findFirst({
    where: (t, { eq }) => eq(t.isActive, true),
  });

  if (!activeTerm) return [];

  // Check if today is a holiday
  const todayHoliday = await db.query.holiday.findFirst({
    where: and(eq(holiday.startDate, today), eq(holiday.termId, activeTerm.id)),
  });

  if (todayHoliday) return [];

  // Count enrolled kids in the active term
  const enrolledKids = await db
    .select({ id: kid.id })
    .from(kid)
    .where(
      and(eq(kid.enrolledTermId, activeTerm.id), eq(kid.status, 'enrolled'))
    );

  if (enrolledKids.length === 0) return [];

  const enrolledKidIds = enrolledKids.map((k) => k.id);

  // Count how many enrolled kids already have observations
  const observedKids = await db
    .select({ kidId: observation.kidId })
    .from(observation)
    .where(
      and(
        eq(observation.date, today),
        inArray(observation.kidId, enrolledKidIds)
      )
    );

  const observedKidIds = new Set(observedKids.map((o) => o.kidId));
  const pendingKids = enrolledKidIds.filter((id) => !observedKidIds.has(id));

  if (pendingKids.length > 0) {
    // Check if we already sent a reminder today
    const existingLog = await db.query.reminderLog.findFirst({
      where: and(
        eq(reminderLog.type, 'capture_pending'),
        eq(reminderLog.date, today)
      ),
    });

    if (!existingLog) {
      for (const st of activeTypes) {
        eligibleSessions.push({
          sessionId: st.id,
          sessionLabel: st.name,
          sessionDate: today,
          endTime: st.end,
          pendingKidCount: pendingKids.length,
        });
      }
    }
  }

  return eligibleSessions;
}

/**
 * Aggregate multiple same-day sessions into single notification.
 */
function aggregateByDate(
  sessions: IPendingSession[]
): Map<string, IPendingSession[]> {
  const byDate = new Map<string, IPendingSession[]>();

  for (const session of sessions) {
    const existing = byDate.get(session.sessionDate) || [];
    existing.push(session);
    byDate.set(session.sessionDate, existing);
  }

  return byDate;
}

// ============================================================
// Schedule-Entry Reminder
// ============================================================

/**
 * Check if next week's schedule is empty (no schedule items).
 */
export async function shouldFireScheduleReminder(): Promise<boolean> {
  const now = new Date();
  const dayOfWeek = now.getDay();

  if (dayOfWeek !== 4) return false;

  // Calculate next week's Monday
  const nextWeekMonday = new Date(now);
  nextWeekMonday.setDate(now.getDate() + (4 - dayOfWeek) + 3);
  const nextWeekFriday = new Date(nextWeekMonday);
  nextWeekFriday.setDate(nextWeekMonday.getDate() + 4);

  // Check if Thursday itself is a holiday
  const today = now.toISOString().split('T')[0];
  const todayHolidays = await db.query.holiday.findMany({
    where: and(
      eq(holiday.startDate, today),
      lte(holiday.startDate, holiday.endDate) // covers single-day or multi-day
    ),
  });

  if (todayHolidays.length > 0) return false;

  // Get session types (proxy for checking if schedule exists)
  const activeTypes = await db.query.sessionType.findMany({
    where: and(eq(sessionType.active, true), isNull(sessionType.deletedAt)),
  });

  // Check if we already sent a schedule_entry reminder this week
  const existingLog = await db.query.reminderLog.findFirst({
    where: and(
      eq(reminderLog.type, 'schedule_entry'),
      gte(
        reminderLog.createdAt,
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay()
        )
      )
    ),
  });

  if (existingLog) return false;

  // ponytail: simplified - fire if there are active session types and no other constraint
  return activeTypes.length > 0;
}

// ============================================================
// Notification Delivery
// ============================================================

async function getOwnerPushSubscriptions() {
  const owners = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, 'owner'));

  if (owners.length === 0) return [];

  const ownerIds = owners.map((o) => o.id);

  const subscriptions = await db
    .select()
    .from(pushSubscription)
    .where(
      and(
        inArray(pushSubscription.userId, ownerIds),
        eq(pushSubscription.isActive, true)
      )
    );

  return subscriptions;
}

async function isReminderEnabled(
  userId: string,
  type: 'capture_pending' | 'schedule_entry'
): Promise<boolean> {
  const config = await db.query.reminderConfig.findFirst({
    where: eq(reminderConfig.userId, userId),
  });

  if (!config) return true;

  if (type === 'capture_pending') return config.captureReminderEnabled;
  return config.scheduleReminderEnabled;
}

async function processCapturePendingReminders(): Promise<number> {
  const pendingSessions = await findPendingCaptureSessions();
  if (pendingSessions.length === 0) return 0;

  const byDate = aggregateByDate(pendingSessions);
  let totalFired = 0;

  const subscriptions = await getOwnerPushSubscriptions();
  if (subscriptions.length === 0) return 0;

  for (const [, sessions] of byDate) {
    const totalPending = sessions.reduce(
      (sum, s) => sum + s.pendingKidCount,
      0
    );
    const sessionLabels = sessions.map((s) => s.sessionLabel).join(', ');

    const body =
      sessions.length > 1
        ? `${sessions.length} sesi (${sessionLabels}) — ${totalPending} anak perlu dicapture`
        : `${sessions[0].sessionLabel} — ${totalPending} anak perlu dicapture`;

    for (const sub of subscriptions) {
      const enabled = await isReminderEnabled(sub.userId, 'capture_pending');
      if (!enabled) continue;

      for (const session of sessions) {
        const scheduledAt = new Date(
          `${session.sessionDate}T${session.endTime}`
        );

        await db.insert(reminderLog).values({
          userId: sub.userId,
          type: 'capture_pending',
          date: session.sessionDate,
          sessionTypeId: session.sessionId, // sessionId now holds the sessionTypeId
          scheduledAt: scheduledAt,
          sentAt: new Date(),
        });
      }

      const result = await sendPushNotification(sub, {
        title: 'Capture Tertunda',
        body,
        url: '/dashboard/owner',
      });

      if (result.success) totalFired++;

      if (result.needsRemoval) {
        await db
          .update(pushSubscription)
          .set({ isActive: false })
          .where(eq(pushSubscription.id, sub.id));
      }
    }
  }

  return totalFired;
}

async function processScheduleEntryReminders(): Promise<number> {
  const shouldFire = await shouldFireScheduleReminder();
  if (!shouldFire) return 0;

  const subscriptions = await getOwnerPushSubscriptions();
  if (subscriptions.length === 0) return 0;

  let fired = 0;

  for (const sub of subscriptions) {
    const enabled = await isReminderEnabled(sub.userId, 'schedule_entry');
    if (!enabled) continue;

    await db.insert(reminderLog).values({
      userId: sub.userId,
      type: 'schedule_entry',
      scheduledAt: new Date(),
      sentAt: new Date(),
    });

    const result = await sendPushNotification(sub, {
      title: 'Jadwal Minggu Depan Kosong',
      body: 'Jadwal minggu depan belum diisi. Masukkan sekarang.',
      url: '/dashboard/owner/schedule',
    });

    if (result.success) fired++;

    if (result.needsRemoval) {
      await db
        .update(pushSubscription)
        .set({ isActive: false })
        .where(eq(pushSubscription.id, sub.id));
    }
  }

  return fired;
}

async function cleanupOldReminderLogs(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .delete(reminderLog)
    .where(lte(reminderLog.createdAt, thirtyDaysAgo));

  return typeof result === 'object' && result !== null && 'rowCount' in result
    ? (result as { rowCount: number }).rowCount
    : 0;
}

/**
 * Main reminder processor — called by the cron endpoint.
 */
export async function processReminders(): Promise<{
  capturePendingFired: number;
  scheduleEntryFired: number;
  cleanupDeleted: number;
}> {
  const [capturePendingFired, scheduleEntryFired, cleanupDeleted] =
    await Promise.all([
      processCapturePendingReminders(),
      processScheduleEntryReminders(),
      cleanupOldReminderLogs(),
    ]);

  return { capturePendingFired, scheduleEntryFired, cleanupDeleted };
}
