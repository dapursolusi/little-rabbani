import {
  KID_APPETITE,
  KID_ATTENDANCE,
  KID_MOOD,
} from '@/features/daily-class-report/constants';
import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { classSession } from './enrollment';
import { kid } from './kids';
import { subTheme } from './theme';

export const dailyClassReport = pgTable(
  'daily_class_report',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classSessionId: uuid('class_session_id')
      .notNull()
      .references(() => classSession.id, { onDelete: 'restrict' }),
    subThemeId: uuid('sub_theme_id').references(() => subTheme.id, {
      onDelete: 'restrict',
    }),
    date: text('date').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    classSessionIdx: index('dcr_class_session_idx').on(table.classSessionId),
    subThemeIdx: index('dcr_sub_theme_idx').on(table.subThemeId),
    classSessionIdDateIdx: unique('dcr_class_session_id_date_idx').on(
      table.classSessionId,
      table.date
    ),
  })
);

export const dcrRelationship = relations(dailyClassReport, ({ one, many }) => ({
  classSession: one(classSession, {
    fields: [dailyClassReport.classSessionId],
    references: [classSession.id],
  }),
  subTheme: one(subTheme, {
    fields: [dailyClassReport.subThemeId],
    references: [subTheme.id],
  }),
  observations: many(dcrObservation),
}));

export const kidAttendanceEnum = pgEnum('kid_attendance', KID_ATTENDANCE);
export const kidMoodEnum = pgEnum('kid_mood', KID_MOOD);
export const kidAppetiteEnum = pgEnum('kid_appetite', KID_APPETITE);

export const dcrObservation = pgTable(
  'dcr_observation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    dcrId: uuid('daily_class_report_id')
      .notNull()
      .references(() => dailyClassReport.id, { onDelete: 'restrict' }),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'restrict' }),
    attendance: kidAttendanceEnum('attendance').notNull(),
    mood: kidMoodEnum('mood'),
    appetite: kidAppetiteEnum('appetite'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    dcrIdx: index('dcr_idx').on(table.dcrId),
    kidIdx: index('kid_idx').on(table.kidId),
    dcrIdKidIdIdx: unique('dcr_id_kid_id_idx').on(table.dcrId, table.kidId),
    attendanceRequirementCheck: check(
      'attendance_requirement_check',
      sql`CASE
            WHEN ${table.attendance} = 'present'
            THEN ${table.mood} IS NOT NULL AND ${table.appetite} IS NOT NULL
            ELSE TRUE
          END`
    ),
  })
);

export const dcrObservationRelationship = relations(
  dcrObservation,
  ({ one }) => ({
    dcr: one(dailyClassReport, {
      fields: [dcrObservation.dcrId],
      references: [dailyClassReport.id],
    }),
    kid: one(kid, {
      fields: [dcrObservation.kidId],
      references: [kid.id],
    }),
  })
);
