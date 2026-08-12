import { relations, sql } from 'drizzle-orm';
import {
  AnyPgColumn,
  boolean,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth';
import { dailyClassSchedule } from './calendar';
import { sessionType, term } from './enrollment';
import { kid } from './kids';
import { observation, observationActivity } from './observation';

// ─────────────── Daily Class Report (DCR) ───────────────

export const deviationEnum = pgEnum('deviation', [
  'done',
  'skipped',
  'modified',
]);

export const dailyClassReport = pgTable(
  'daily_class_report',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    date: date('date').notNull(),
    termId: uuid('term_id')
      .notNull()
      .references(() => term.id, { onDelete: 'restrict' }),
    sessionTypeId: uuid('session_type_id')
      .notNull()
      .references(() => sessionType.id, { onDelete: 'cascade' }),
    scheduleId: uuid('schedule_id').references(() => dailyClassSchedule.id, {
      onDelete: 'set null',
    }),
    learningNotes: text('learning_notes'),
    capturedBy: text('captured_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    termIdIdx: index('dcr_term_idx').on(table.termId),
    sessionTypeIdIdx: index('dcr_session_type_idx').on(table.sessionTypeId),
    scheduleIdIdx: index('dcr_schedule_idx').on(table.scheduleId),
    capturedByIdx: index('dcr_captured_by_idx').on(table.capturedBy),
    dcrDateSessionTypeUnique: uniqueIndex('dcr_date_session_type_unique')
      .on(table.date, table.sessionTypeId)
      .where(sql`${table.deletedAt} IS NULL`),
  })
);

export const dailyClassReportRelations = relations(
  dailyClassReport,
  ({ one, many }) => ({
    term: one(term, {
      fields: [dailyClassReport.termId],
      references: [term.id],
    }),
    sessionType: one(sessionType, {
      fields: [dailyClassReport.sessionTypeId],
      references: [sessionType.id],
    }),
    capturedByUser: one(user, {
      fields: [dailyClassReport.capturedBy],
      references: [user.id],
    }),
    dailyClassSchedule: one(dailyClassSchedule, {
      fields: [dailyClassReport.scheduleId],
      references: [dailyClassSchedule.id],
    }),
    dcrActivities: many(dcrActivity),
  })
);

export const dcrActivity = pgTable(
  'dcr_activity',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dcrId: uuid('dcr_id')
      .notNull()
      .references(() => dailyClassReport.id, { onDelete: 'cascade' }),
    activityNameOther: text('activity_name_other'),
    deviation: deviationEnum('deviation').notNull().default('done'),
    wasPlanned: boolean('was_planned').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    dcrIdIdx: index('dcr_activity_dcr_id_idx').on(table.dcrId),
  })
);

export const dcrActivityRelations = relations(dcrActivity, ({ one, many }) => ({
  dcr: one(dailyClassReport, {
    fields: [dcrActivity.dcrId],
    references: [dailyClassReport.id],
  }),
  observationActivities: many(observationActivity),
}));

// ─────────────── Idempotency Keys Table ───────────────
// VAL-CAPTURE-040: Server-side idempotency key storage for deduplication

export const idempotencyKey = pgTable(
  'idempotency_key',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => ({
    expiresAtIdx: index('idempotency_key_expires_at_idx').on(table.expiresAt),
  })
);

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

export const reportStatusEnum = pgEnum('report_status', [
  'draft',
  'final',
  'stale',
]);

// ─────────────── Daily Kid Report Snapshots Table ───────────────
// Stores generated daily parent reports for each kid per session.
// One snapshot per (kid_id, session_id) — re-generation upserts.
// Two-layer model: structured_json (read-only) + editable AI narrative.

export const dailyKidReportSnapshot = pgTable(
  'daily_kid_report_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'cascade' }),
    dcrId: uuid('dcr_id')
      .notNull()
      .references(() => dailyClassReport.id, { onDelete: 'cascade' }),
    structuredJson: jsonb('structured_json').notNull(), // JSONB of structured data
    narrativeAiDraft: text('narrative_ai_draft'),
    narrativeFinal: text('narrative_final'),
    status: reportStatusEnum('status').notNull().default('draft'),
    editedBy: text('edited_by').references(() => user.id, {
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
    kidIdIdx: index('dkrs_kid_idx').on(table.kidId),
    dcrIdIdx: index('dkrs_dcr_idx').on(table.dcrId),
    editorIdx: index('dkrs_edited_by_idx').on(table.editedBy),
    dcrStatusIdx: index('dkrs_dcr_status_idx').on(table.dcrId, table.status),
    uniqueKidDcr: uniqueIndex('dkrs_kid_dcr_unique')
      .on(table.kidId, table.dcrId)
      .where(sql`${table.deletedAt} IS NULL`),
    compositeKidFkTarget: unique('dkrs_kid_id_unique').on(
      table.kidId,
      table.id
    ),
  })
);

export const dailyKidReportSnapshotRelations = relations(
  dailyKidReportSnapshot,
  ({ one, many }) => ({
    kid: one(kid, {
      fields: [dailyKidReportSnapshot.kidId],
      references: [kid.id],
    }),
    dcr: one(dailyClassReport, {
      fields: [dailyKidReportSnapshot.dcrId],
      references: [dailyClassReport.id],
    }),
    editor: one(user, {
      fields: [dailyKidReportSnapshot.editedBy],
      references: [user.id],
    }),
    observations: many(observation, {
      relationName: 'observationByDkrs',
    }),
  })
);

// ─────────────── Monthly Kid Report Snapshots Table ───────────────
// Stores generated monthly reports for each kid per month.
// Stats are computed via SQL aggregation (attendance %, mood/appetite
// distribution, activity participation counts). AI narrative sourced
// from daily report narratives. Observations are locked on generation.

export const monthlyKidReportSnapshot = pgTable(
  'monthly_kid_report_snapshot',
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
    status: reportStatusEnum('status').notNull().default('draft'),
    editedBy: text('edited_by').references(() => user.id, {
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
    kidIdIdx: index('mkrs_kid_idx').on(table.kidId),
    termIdIdx: index('mkrs_term_idx').on(table.termId),
    editorIdx: index('mkrs_edited_by_idx').on(table.editedBy),
    termKidIdx: index('mkrs_term_kid_idx').on(table.termId, table.kidId),
    uniqueKidMonth: uniqueIndex('mkrs_kid_month_unique')
      .on(table.kidId, table.month)
      .where(sql`${table.deletedAt} IS NULL`),
  })
);

export const monthlyKidReportSnapshotRelations = relations(
  monthlyKidReportSnapshot,
  ({ one }) => ({
    kid: one(kid, {
      fields: [monthlyKidReportSnapshot.kidId],
      references: [kid.id],
    }),
    term: one(term, {
      fields: [monthlyKidReportSnapshot.termId],
      references: [term.id],
    }),
    editor: one(user, {
      fields: [monthlyKidReportSnapshot.editedBy],
      references: [user.id],
    }),
  })
);

// ─────────────── Quarterly Kid Report Snapshots Table ───────────────
// Stores generated quarterly report PDFs and narrative sections for each
// kid per term. AI-drafted from current-term daily narratives + previous-term
// snapshot delta. First-term quarterly generates without delta.
// PDF stored as base64 in DB for v1.

export const quarterlyKidReportSnapshot = pgTable(
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
    previousSnapshotId: uuid('previous_snapshot_id').references(
      (): AnyPgColumn => quarterlyKidReportSnapshot.id
    ), // FK added via migration (self-ref)
    status: reportStatusEnum('status').notNull().default('draft'),
    editedBy: text('edited_by').references(() => user.id, {
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
    kidIdIdx: index('qkrs_kid_idx').on(table.kidId),
    termIdIdx: index('qkrs_term_idx').on(table.termId),
    editorIdx: index('qkrs_edited_by_idx').on(table.editedBy),
    previousSnapshotIdIdx: index('qkrs_previous_snapshot_idx').on(
      table.previousSnapshotId
    ),
    uniqueKidTerm: uniqueIndex('qkrs_kid_term_unique')
      .on(table.kidId, table.termId)
      .where(sql`${table.deletedAt} IS NULL`),
  })
);

export const quarterlyKidReportSnapshotRelations = relations(
  quarterlyKidReportSnapshot,
  ({ one }) => ({
    kid: one(kid, {
      fields: [quarterlyKidReportSnapshot.kidId],
      references: [kid.id],
    }),
    term: one(term, {
      fields: [quarterlyKidReportSnapshot.termId],
      references: [term.id],
    }),
    editor: one(user, {
      fields: [quarterlyKidReportSnapshot.editedBy],
      references: [user.id],
    }),
    previousSnapshot: one(quarterlyKidReportSnapshot, {
      fields: [quarterlyKidReportSnapshot.previousSnapshotId],
      references: [quarterlyKidReportSnapshot.id],
    }),
  })
);
