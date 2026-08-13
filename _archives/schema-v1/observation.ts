import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth';
import { kid } from './kids';
import { dailyKidReportSnapshot, dcrActivity } from './reports';

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

export const observation = pgTable(
  'observation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kidId: uuid('kid_id').notNull(),
    dkrsId: uuid('dkrs_id')
      .notNull()
      .references(() => dailyKidReportSnapshot.id, { onDelete: 'cascade' }),
    teacherId: text('teacher_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    mood: integer('mood').notNull(),
    appetite: appetiteEnum('appetite').notNull(),
    presence: presenceEnum('presence').notNull(),
    absenceReason: absenceReasonEnum('absence_reason'),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    kidIdIdx: index('observation_kid_id_idx').on(table.kidId),
    dkrsIdIdx: index('observation_dkrs_id_idx').on(table.dkrsId),
    teacherIdIdx: index('observation_teacher_id_idx').on(table.teacherId),
    uniqueKidObservation: uniqueIndex('observation_kid_dkrs_unique')
      .on(table.kidId, table.dkrsId)
      .where(sql`${table.deletedAt} IS NULL`),
    moodCheck: check(
      'observation_mood_check',
      sql`${table.mood} BETWEEN 1 AND 5`
    ),
    absenceReasonCheck: check(
      'observation_absence_reason_check',
      sql`${table.absenceReason} IS NULL OR ${table.presence} = 'absent'`
    ),
    compositeKidFk: foreignKey({
      columns: [table.kidId, table.dkrsId],
      foreignColumns: [dailyKidReportSnapshot.kidId, dailyKidReportSnapshot.id],
    }).onDelete('cascade'),
  })
);

export const observationRelations = relations(observation, ({ one, many }) => ({
  kid: one(kid, {
    fields: [observation.kidId],
    references: [kid.id],
  }),
  dailyKidReportSnapshot: one(dailyKidReportSnapshot, {
    fields: [observation.dkrsId],
    references: [dailyKidReportSnapshot.id],
    relationName: 'observationByDkrs',
  }),
  teacher: one(user, {
    fields: [observation.teacherId],
    references: [user.id],
  }),
  notes: many(observationNote),
  activities: many(observationActivity),
}));

export const observationNote = pgTable(
  'observation_note',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    observationId: uuid('observation_id')
      .notNull()
      .references(() => observation.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    observationIdIdx: index('observation_note_observation_id_idx').on(
      table.observationId
    ),
  })
);

export const observationNoteRelations = relations(
  observationNote,
  ({ one }) => ({
    observation: one(observation, {
      fields: [observationNote.observationId],
      references: [observation.id],
    }),
  })
);

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
    participated: boolean('participated').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    observationIdIdx: index('observation_activity_observation_id_idx').on(
      table.observationId
    ),
    dcrActivityIdIdx: index('observation_activity_dcr_activity_id_idx').on(
      table.dcrActivityId
    ),
    uniqueObservationActivity: uniqueIndex('observation_activity_unique')
      .on(table.observationId, table.dcrActivityId)
      .where(sql`${table.deletedAt} IS NULL`),
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
