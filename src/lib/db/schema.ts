import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const activityCategoryEnum = pgEnum('activity_category', [
  'seni',
  'olahraga',
  'musik',
  'bahasa',
  'matematika',
  'sains',
  'agama',
  'bermain',
  'outing',
  'lainnya',
]);

export const roleEnum = pgEnum('role', ['owner', 'teacher']);
export const kidStatusEnum = pgEnum('kid_status', [
  'waiting',
  'enrolled',
  'alumni',
]);

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: roleEnum('role').notNull().default('teacher'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const guardian = pgTable('guardian', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  secondContactName: text('second_contact_name'),
  secondContactPhone: text('second_contact_phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const term = pgTable('term', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const kid = pgTable('kid', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  dob: date('dob').notNull(),
  status: kidStatusEnum('status').notNull().default('waiting'),
  guardianId: uuid('guardian_id')
    .notNull()
    .references(() => guardian.id, { onDelete: 'restrict' }),
  enrolledTermId: uuid('enrolled_term_id').references(() => term.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const termSession = pgTable('term_session', {
  id: uuid('id').defaultRandom().primaryKey(),
  termId: uuid('term_id')
    .notNull()
    .references(() => term.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  label: text('label').notNull(),
  isHoliday: boolean('is_holiday').notNull().default(false),
  holidayReason: text('holiday_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

// Relations

export const guardianRelations = relations(guardian, ({ many }) => ({
  kids: many(kid),
}));

export const kidRelations = relations(kid, ({ one }) => ({
  guardian: one(guardian, {
    fields: [kid.guardianId],
    references: [guardian.id],
  }),
  enrolledTerm: one(term, {
    fields: [kid.enrolledTermId],
    references: [term.id],
  }),
}));

export const termRelations = relations(term, ({ many }) => ({
  kids: many(kid),
  sessions: many(termSession),
}));

export const activity = pgTable('activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: activityCategoryEnum('category').notNull().default('lainnya'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const scheduleItemTypeEnum = pgEnum('schedule_item_type', [
  'activity',
  'outing',
]);

export const scheduleItem = pgTable('schedule_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => termSession.id, { onDelete: 'cascade' }),
  activityId: uuid('activity_id').references(() => activity.id, {
    onDelete: 'set null',
  }),
  type: scheduleItemTypeEnum('type').notNull(),
  outingLocation: text('outing_location'),
  outingBringItems: text('outing_bring_items'),
  outingPermissionRequired: boolean('outing_permission_required')
    .notNull()
    .default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const termSessionRelations = relations(termSession, ({ one, many }) => ({
  term: one(term, {
    fields: [termSession.termId],
    references: [term.id],
  }),
  scheduleItems: many(scheduleItem),
}));

export const scheduleItemRelations = relations(scheduleItem, ({ one }) => ({
  session: one(termSession, {
    fields: [scheduleItem.sessionId],
    references: [termSession.id],
  }),
  activity: one(activity, {
    fields: [scheduleItem.activityId],
    references: [activity.id],
  }),
}));

// ─────────────── Daily Class Report (DCR) ───────────────

export const deviationEnum = pgEnum('deviation', [
  'done',
  'skipped',
  'modified',
]);

export const dailyClassReport = pgTable('daily_class_report', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .unique()
    .references(() => termSession.id, { onDelete: 'cascade' }),
  learningNotes: text('learning_notes'),
  capturedBy: text('captured_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  capturedAt: timestamp('captured_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const dcrActivity = pgTable('dcr_activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  dcrId: uuid('dcr_id')
    .notNull()
    .references(() => dailyClassReport.id, { onDelete: 'cascade' }),
  activityId: uuid('activity_id').references(() => activity.id, {
    onDelete: 'set null',
  }),
  activityNameOther: text('activity_name_other'),
  deviation: deviationEnum('deviation').notNull().default('done'),
  wasPlanned: boolean('was_planned').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ─────────────── DCR Relations ───────────────

export const dailyClassReportRelations = relations(
  dailyClassReport,
  ({ one, many }) => ({
    session: one(termSession, {
      fields: [dailyClassReport.sessionId],
      references: [termSession.id],
    }),
    capturedByUser: one(user, {
      fields: [dailyClassReport.capturedBy],
      references: [user.id],
    }),
    dcrActivities: many(dcrActivity),
  })
);

export const dcrActivityRelations = relations(dcrActivity, ({ one }) => ({
  dcr: one(dailyClassReport, {
    fields: [dcrActivity.dcrId],
    references: [dailyClassReport.id],
  }),
  activity: one(activity, {
    fields: [dcrActivity.activityId],
    references: [activity.id],
  }),
}));

// ─────────────── Teacher Observation Capture ───────────────

export const appetiteEnum = pgEnum('appetite', ['good', 'moderate', 'poor']);
export const presenceEnum = pgEnum('presence', [
  'present_full',
  'late',
  'early_pickup',
  'absent',
]);
export const absenceReasonEnum = pgEnum('absence_reason', [
  'sick',
  'family',
  'permission',
  'other',
]);
export const participationEnum = pgEnum('participation', ['yes', 'no']);

export const observation = pgTable(
  'observation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => termSession.id, { onDelete: 'cascade' }),
    teacherId: text('teacher_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    mood: integer('mood').notNull(),
    appetite: appetiteEnum('appetite').notNull(),
    presence: presenceEnum('presence').notNull(),
    absenceReason: absenceReasonEnum('absence_reason'),
    version: integer('version').notNull().default(0),
    capturedAt: timestamp('captured_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    uniqueKidSession: unique().on(table.kidId, table.sessionId),
  })
);

export const observationNote = pgTable('observation_note', {
  id: uuid('id').defaultRandom().primaryKey(),
  observationId: uuid('observation_id')
    .notNull()
    .references(() => observation.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const observationActivity = pgTable(
  'observation_activity',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    observationId: uuid('observation_id')
      .notNull()
      .references(() => observation.id, { onDelete: 'cascade' }),
    dcrActivityId: uuid('dcr_activity_id')
      .notNull()
      .references(() => dcrActivity.id, { onDelete: 'cascade' }),
    participated: participationEnum('participated').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueObservationActivity: unique().on(
      table.observationId,
      table.dcrActivityId
    ),
  })
);

// ─────────────── Idempotency Keys Table ───────────────
// VAL-CAPTURE-040: Server-side idempotency key storage for deduplication

export const idempotencyKey = pgTable('idempotency_key', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

// ─────────────── Report Templates Table ───────────────
// Stores prompt templates for AI narrative generation so Owner can
// iterate wording without code deploys. Key is a unique identifier
// (e.g., "daily_narrative_system", "daily_narrative_user"), template_text
// contains the actual prompt template string.

export const reportTemplate = pgTable('report_template', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  templateText: text('template_text').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

// ─────────────── Monthly Report Snapshots Table ───────────────
// Stores generated monthly reports for each kid per month.
// Stats are computed via SQL aggregation (attendance %, mood/appetite
// distribution, activity participation counts). AI narrative sourced
// from daily report narratives. Observations are locked on generation.

export const monthlyReportStatusEnum = pgEnum('monthly_report_status', [
  'draft',
  'final',
  'stale',
]);

export const monthlyReportSnapshot = pgTable(
  'monthly_report_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => term.id, { onDelete: 'cascade' }),
    month: text('month').notNull(), // Format: "2025-06" (ISO year-month)
    statsJson: jsonb('stats_json').notNull(), // JSONB of computed stats
    narrativeAiDraft: text('narrative_ai_draft'),
    narrativeFinal: text('narrative_final'),
    lockedObservationIds: jsonb('locked_observation_ids'), // JSONB array of observation IDs
    status: monthlyReportStatusEnum('status').notNull().default('draft'),
    editedBy: uuid('edited_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    uniqueKidMonth: unique().on(table.kidId, table.month),
  })
);

export const monthlyReportSnapshotRelations = relations(
  monthlyReportSnapshot,
  ({ one }) => ({
    kid: one(kid, {
      fields: [monthlyReportSnapshot.kidId],
      references: [kid.id],
    }),
    term: one(term, {
      fields: [monthlyReportSnapshot.termId],
      references: [term.id],
    }),
    editor: one(user, {
      fields: [monthlyReportSnapshot.editedBy],
      references: [user.id],
    }),
  })
);

// ─────────────── Daily Report Snapshots Table ───────────────
// Stores generated daily parent reports for each kid per session.
// One snapshot per (kid_id, session_id) — re-generation upserts.
// Two-layer model: structured_json (read-only) + editable AI narrative.

export const dailyReportStatusEnum = pgEnum('daily_report_status', [
  'draft',
  'sent',
  'stale',
]);

export const dailyReportSnapshot = pgTable(
  'daily_report_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => termSession.id, { onDelete: 'cascade' }),
    structuredJson: jsonb('structured_json').notNull(), // JSONB of structured data
    narrativeAiDraft: text('narrative_ai_draft'),
    narrativeFinal: text('narrative_final'),
    status: dailyReportStatusEnum('status').notNull().default('draft'),
    editedBy: uuid('edited_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    uniqueKidSession: unique().on(table.kidId, table.sessionId),
  })
);

export const dailyReportSnapshotRelations = relations(
  dailyReportSnapshot,
  ({ one }) => ({
    kid: one(kid, {
      fields: [dailyReportSnapshot.kidId],
      references: [kid.id],
    }),
    session: one(termSession, {
      fields: [dailyReportSnapshot.sessionId],
      references: [termSession.id],
    }),
    editor: one(user, {
      fields: [dailyReportSnapshot.editedBy],
      references: [user.id],
    }),
  })
);

// ─────────────── Quarterly Report Snapshots Table ───────────────
// Stores generated quarterly report PDFs and narrative sections for each
// kid per term. AI-drafted from current-term daily narratives + previous-term
// snapshot delta. First-term quarterly generates without delta.
// PDF stored as base64 in DB for v1.

export const quarterlyReportStatusEnum = pgEnum('quarterly_report_status', [
  'draft',
  'final',
  'stale',
]);

export const quarterlyReportSnapshot = pgTable(
  'quarterly_report_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => term.id, { onDelete: 'cascade' }),
    statsJson: jsonb('stats_json'), // JSONB of computed term stats (optional)
    sectionsJson: jsonb('sections_json'), // JSONB of sections: {changes, improvements, recommendations}
    narrativeAiDraft: text('narrative_ai_draft'),
    narrativeFinal: text('narrative_final'),
    pdfData: text('pdf_data'), // base64-encoded PDF data
    previousSnapshotId: uuid('previous_snapshot_id'), // FK added via migration (self-ref)
    status: quarterlyReportStatusEnum('status').notNull().default('draft'),
    editedBy: uuid('edited_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    uniqueKidTerm: unique().on(table.kidId, table.termId),
  })
);

export const quarterlyReportSnapshotRelations = relations(
  quarterlyReportSnapshot,
  ({ one }) => ({
    kid: one(kid, {
      fields: [quarterlyReportSnapshot.kidId],
      references: [kid.id],
    }),
    term: one(term, {
      fields: [quarterlyReportSnapshot.termId],
      references: [term.id],
    }),
    editor: one(user, {
      fields: [quarterlyReportSnapshot.editedBy],
      references: [user.id],
    }),
    previousSnapshot: one(quarterlyReportSnapshot, {
      fields: [quarterlyReportSnapshot.previousSnapshotId],
      references: [quarterlyReportSnapshot.id],
    }),
  })
);

// ─────────────── Observation Relations ───────────────

export const observationRelations = relations(observation, ({ one, many }) => ({
  kid: one(kid, {
    fields: [observation.kidId],
    references: [kid.id],
  }),
  session: one(termSession, {
    fields: [observation.sessionId],
    references: [termSession.id],
  }),
  teacher: one(user, {
    fields: [observation.teacherId],
    references: [user.id],
  }),
  notes: many(observationNote),
  activities: many(observationActivity),
}));

export const observationNoteRelations = relations(
  observationNote,
  ({ one }) => ({
    observation: one(observation, {
      fields: [observationNote.observationId],
      references: [observation.id],
    }),
  })
);

export const observationActivityRelations = relations(
  observationActivity,
  ({ one }) => ({
    observation: one(observation, {
      fields: [observationActivity.observationId],
      references: [observation.id],
    }),
    dcrActivity: one(dcrActivity, {
      fields: [observationActivity.dcrActivityId],
      references: [dcrActivity.id],
    }),
  })
);

// ─────────────── Reminders Layer (M6) ───────────────
// Push notifications subscription store.
// One subscription per user (upsert on re-subscribe).

export const pushSubscription = pgTable('push_subscription', {
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
});

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

export const reminderLog = pgTable('reminder_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: reminderTypeEnum('type').notNull(),
  sessionId: uuid('session_id').references(() => termSession.id, {
    onDelete: 'set null',
  }),
  scheduledAt: timestamp('scheduled_at').notNull(),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  acknowledgedAt: timestamp('acknowledged_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const reminderLogRelations = relations(reminderLog, ({ one }) => ({
  user: one(user, {
    fields: [reminderLog.userId],
    references: [user.id],
  }),
  session: one(termSession, {
    fields: [reminderLog.sessionId],
    references: [termSession.id],
  }),
}));
