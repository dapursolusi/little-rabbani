// Reminder processing logic
// Checks conditions and fires push notifications for:
// - Capture-pending: 15 min after session end if observations pending
// - Schedule-entry: Thursday morning if next week's schedule is empty
import { and, eq, gte, inArray, isNull, lte } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  kid,
  observation,
  pushSubscription,
  reminderConfig,
  reminderLog,
  sessionType,
  termSession,
  user,
} from '@/lib/db/schema';

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
 * Find sessions that ended more than 15 minutes ago and have pending observations.
 * Only considers sessions with enrolled kids (status = 'enrolled') in the active term.
 * VAL-REMIN-001: Fires 15 min after session end.
 * VAL-REMIN-008: Skips sessions with no enrolled kids.
 * VAL-REMIN-009: Multiple same-day sessions aggregate into single reminder.
 */
export async function findPendingCaptureSessions(): Promise<IPendingSession[]> {
  const now = new Date();

  // Get sessions that ended at least 15 minutes ago
  const today = now.toISOString().split('T')[0];

  // Find sessions that ended at least 15 min ago
  // Constrain to recent sessions (yesterday onwards) to prevent stale reminders
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const sessions = await db.query.termSession.findMany({
    where: and(
      eq(termSession.isHoliday, false),
      gte(termSession.date, yesterdayStr),
      lte(termSession.date, today)
      // end_time is a text field like "10:00", compare lexicographically
      // We'll do the comparison in code
    ),
    with: {
      term: true,
    },
  });

  // Filter sessions that ended at least 15 min ago
  const eligibleSessions: IPendingSession[] = [];

  for (const session of sessions) {
    const sessionEnd = new Date(`${session.date}T${session.endTime}`);
    const diffMs = now.getTime() - sessionEnd.getTime();

    // Session must have ended at least 15 min ago (and be in the past)
    if (diffMs < 15 * 60 * 1000) continue;

    // Check if we already sent a capture_pending reminder for this session
    const existingLog = await db.query.reminderLog.findFirst({
      where: and(
        eq(reminderLog.type, 'capture_pending'),
        eq(reminderLog.sessionId, session.id)
      ),
    });

    if (existingLog) continue;

    // Count enrolled kids in this session's term
    const enrolledKids = await db
      .select({ id: kid.id })
      .from(kid)
      .where(
        and(eq(kid.enrolledTermId, session.termId), eq(kid.status, 'enrolled'))
      );

    // VAL-REMIN-008: Skip if no enrolled kids
    if (enrolledKids.length === 0) continue;

    const enrolledKidIds = enrolledKids.map((k) => k.id);

    // Count how many enrolled kids already have observations
    const observedKids = await db
      .select({ kidId: observation.kidId })
      .from(observation)
      .where(
        and(
          eq(observation.date, session.date),
          inArray(observation.kidId, enrolledKidIds)
        )
      );

    const observedKidIds = new Set(observedKids.map((o) => o.kidId));
    const pendingKids = enrolledKidIds.filter((id) => !observedKidIds.has(id));

    if (pendingKids.length > 0) {
      eligibleSessions.push({
        sessionId: session.id,
        sessionLabel: session.label,
        sessionDate: session.date,
        endTime: session.endTime,
        pendingKidCount: pendingKids.length,
      });
    }
  }

  return eligibleSessions;
}

/**
 * Aggregate multiple same-day sessions into single notification.
 * VAL-REMIN-009: Multiple sessions same day aggregate.
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
 * VAL-REMIN-002: Fires on Thursday morning if next week's schedule empty.
 * VAL-REMIN-010: Thursday holiday suppresses.
 */
export async function shouldFireScheduleReminder(): Promise<boolean> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, ...

  // Only fire on Thursday (day 4)
  if (dayOfWeek !== 4) return false;

  // Calculate next week's Monday and Friday
  const nextWeekMonday = new Date(now);
  nextWeekMonday.setDate(now.getDate() + (4 - dayOfWeek) + 3); // Next Monday
  const nextWeekFriday = new Date(nextWeekMonday);
  nextWeekFriday.setDate(nextWeekMonday.getDate() + 4);

  const nextMon = nextWeekMonday.toISOString().split('T')[0];
  const nextFri = nextWeekFriday.toISOString().split('T')[0];

  // VAL-REMIN-010: Check if Thursday itself is a holiday
  const today = now.toISOString().split('T')[0];
  const todaySessions = await db.query.termSession.findMany({
    where: and(eq(termSession.date, today), eq(termSession.isHoliday, true)),
  });

  if (todaySessions.length > 0) {
    // Thursday is a holiday - suppress
    return false;
  }

  // Get sessions for next week
  const nextWeekSessions = await db.query.termSession.findMany({
    where: and(
      gte(termSession.date, nextMon),
      lte(termSession.date, nextFri),
      eq(termSession.isHoliday, false)
    ),
    with: {
      scheduleItems: true,
    },
  });

  // Check if any of these sessions have schedule items
  const hasScheduleItems = nextWeekSessions.some(
    (session) => session.scheduleItems.length > 0
  );

  if (!hasScheduleItems && nextWeekSessions.length > 0) {
    // No schedule items for next week's sessions
    // Check if we already sent a schedule_entry reminder this week
    const existingLog = await db.query.reminderLog.findFirst({
      where: and(
        eq(reminderLog.type, 'schedule_entry'),
        gte(
          reminderLog.createdAt,
          new Date(now.getFullYear(), now.getMonth(), now.getDate())
        )
      ),
    });

    if (existingLog) return false;

    return true;
  }

  return false;
}

// ============================================================
// Notification Delivery
// ============================================================

/**
 * Get all active push subscriptions for owners.
 * VAL-REMIN-012: Service Worker push subscription stored in DB.
 * VAL-CROSS-023: Push subscription stored and utilized.
 */
async function getOwnerPushSubscriptions() {
  // Get all owner users with active push subscriptions
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

/**
 * Check if a user has reminder enabled for a given type.
 * VAL-REMIN-003: Owner toggles capture-pending reminders off.
 * VAL-REMIN-004: Owner toggles schedule-entry reminders off.
 */
async function isReminderEnabled(
  userId: string,
  type: 'capture_pending' | 'schedule_entry'
): Promise<boolean> {
  const config = await db.query.reminderConfig.findFirst({
    where: eq(reminderConfig.userId, userId),
  });

  if (!config) return true; // Default: enabled

  if (type === 'capture_pending') return config.captureReminderEnabled;
  return config.scheduleReminderEnabled;
}

/**
 * Process capture-pending reminders.
 * Returns number of reminders fired.
 */
async function processCapturePendingReminders(): Promise<number> {
  const pendingSessions = await findPendingCaptureSessions();
  if (pendingSessions.length === 0) return 0;

  // Aggregate by date
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

    // Send notification to each owner who has reminders enabled
    for (const sub of subscriptions) {
      const enabled = await isReminderEnabled(sub.userId, 'capture_pending');
      if (!enabled) continue;

      // Create reminder log entries
      for (const session of sessions) {
        const scheduledAt = new Date(
          `${session.sessionDate}T${session.endTime}`
        );

        // Resolve session type from session label
        const st = await db.query.sessionType.findFirst({
          where: and(
            eq(sessionType.name, session.sessionLabel),
            eq(sessionType.active, true),
            isNull(sessionType.deletedAt)
          ),
          columns: { id: true },
        });

        await db.insert(reminderLog).values({
          userId: sub.userId,
          type: 'capture_pending',
          date: session.sessionDate,
          sessionTypeId: st?.id ?? null,
          sessionId: session.sessionId,
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

      // Remove invalid subscription
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

/**
 * Process schedule-entry reminders.
 * Returns 1 if fired, 0 if not.
 */
async function processScheduleEntryReminders(): Promise<number> {
  const shouldFire = await shouldFireScheduleReminder();
  if (!shouldFire) return 0;

  const subscriptions = await getOwnerPushSubscriptions();
  if (subscriptions.length === 0) return 0;

  let fired = 0;

  for (const sub of subscriptions) {
    const enabled = await isReminderEnabled(sub.userId, 'schedule_entry');
    if (!enabled) continue;

    // Create reminder log entry
    await db.insert(reminderLog).values({
      userId: sub.userId,
      type: 'schedule_entry',
      sessionId: null,
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

/**
 * Clean up reminder logs older than 30 days.
 * VAL-CROSS-019: Reminder log cleanup for entries >30 days old.
 */
async function cleanupOldReminderLogs(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .delete(reminderLog)
    .where(lte(reminderLog.createdAt, thirtyDaysAgo));

  // Return the row count from the result
  return typeof result === 'object' && result !== null && 'rowCount' in result
    ? (result as { rowCount: number }).rowCount
    : 0;
}

/**
 * Main reminder processor — called by the cron endpoint.
 * Handles both reminder types and cleanup.
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
