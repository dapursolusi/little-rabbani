import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth';
import { sessionType } from './enrollment';

// ─────────────── Reminders Layer (M6) ───────────────
// Push notifications subscription store.
// One subscription per user (upsert on re-subscribe).

export const pushSubscription = pgTable(
  'push_subscription',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    userIdIdx: index('push_subscription_user_idx').on(table.userId),
    endpointIdx: index('push_subscription_endpoint_idx').on(table.endpoint),
    uniqueSubscription: unique('push_subscription_unique').on(
      table.userId,
      table.endpoint
    ),
  })
);

export const pushSubscriptionRelations = relations(
  pushSubscription,
  ({ one }) => ({
    user: one(user, {
      fields: [pushSubscription.userId],
      references: [user.id],
    }),
  })
);

// Reminder configuration per user (Owner).
// One row per user. Toggles for capture-pending and schedule-entry reminders.

export const reminderConfig = pgTable('reminder_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  captureReminderEnabled: boolean('capture_reminder_enabled')
    .notNull()
    .default(true),
  scheduleReminderEnabled: boolean('schedule_reminder_enabled')
    .notNull()
    .default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const reminderConfigRelations = relations(reminderConfig, ({ one }) => ({
  user: one(user, {
    fields: [reminderConfig.userId],
    references: [user.id],
  }),
}));

// Reminder log — tracks when reminders fire for audit/cleanup.
// VAL-REMIN-014: Log entries created when reminders fire.
// VAL-CROSS-019: Log cleanup for entries >30 days old.

export const reminderTypeEnum = pgEnum('reminder_type', [
  'capture_pending',
  'schedule_entry',
]);

export const reminderLog = pgTable(
  'reminder_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    type: reminderTypeEnum('type').notNull(),
    date: date('date'),
    sessionTypeId: uuid('session_type_id').references(() => sessionType.id, {
      onDelete: 'set null',
    }),
    scheduledAt: timestamp('scheduled_at').notNull(),
    sentAt: timestamp('sent_at').notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('reminder_log_user_idx').on(table.userId),
    sessionTypeIdIdx: index('reminder_log_session_type_idx').on(
      table.sessionTypeId
    ),
    reminderTypeDateIdx: index('reminder_log_type_date_idx').on(
      table.type,
      table.date
    ),
    reminderUserDateIdx: index('reminder_log_user_date_idx').on(
      table.userId,
      table.date
    ),
    reminderSentAtIdx: index('reminder_log_sent_at_idx').on(table.sentAt),
    sessionTypeCheck: check(
      'reminder_log_session_type_check',
      sql`${table.type} != 'schedule_entry' OR ${table.sessionTypeId} IS NOT NULL`
    ),
  })
);

export const reminderLogRelations = relations(reminderLog, ({ one }) => ({
  user: one(user, {
    fields: [reminderLog.userId],
    references: [user.id],
  }),
  sessionType: one(sessionType, {
    fields: [reminderLog.sessionTypeId],
    references: [sessionType.id],
  }),
}));
