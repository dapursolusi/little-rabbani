import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { calendarEvent, dailyClassSchedule, holiday } from './calendar';
import { kid } from './kids';
import { reminderLog } from './reminder';
import {
  dailyClassReport,
  monthlyKidReportSnapshot,
  quarterlyKidReportSnapshot,
} from './reports';

// ─────────────── Term ───────────────

export const term = pgTable(
  'term',
  {
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
  },
  (table) => ({
    uniqueTermActive: uniqueIndex('term_active')
      .on(table.isActive)
      .where(sql`is_active = true`),
    termDateCheck: check(
      'term_date_check',
      sql`${table.endDate} > ${table.startDate}`
    ),
  })
);

export const termRelations = relations(term, ({ many }) => ({
  schedules: many(dailyClassSchedule),
  sessionEnrollments: many(kidSessionEnrollment),
  holidays: many(holiday),
  dailyClassReports: many(dailyClassReport),
  monthlyReportSnapshots: many(monthlyKidReportSnapshot),
  quarterlyReportSnapshots: many(quarterlyKidReportSnapshot),
}));

// ─────────────── Session ───────────────

export const classSession = pgTable(
  'class_session',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    start: text('start').notNull(), // HH:mm format
    end: text('end').notNull(), // HH:mm format
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    classSessionNameStartEnd: unique('class_session_name_start_end').on(
      table.name,
      table.start,
      table.end
    ),
    classSessionActiveName: uniqueIndex('class_session_active_name')
      .on(table.name)
      .where(sql`active = true`),
  })
);

export const classSessionRelations = relations(classSession, ({ many }) => ({
  sessionEnrollments: many(kidSessionEnrollment),
  dailyClassReports: many(dailyClassReport),
  reminderLogs: many(reminderLog),
  calendarEvents: many(calendarEvent),
}));

// ─────────────── Kid Session Enrollment ───────────────

export const kidSessionEnrollment = pgTable(
  'kid_session_enrollment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => term.id, { onDelete: 'cascade' }),
    classSessionId: uuid('class_session_id')
      .notNull()
      .references(() => classSession.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    kidIdIdx: index('kse_kid_id_idx').on(table.kidId),
    termIdIdx: index('kse_term_id_idx').on(table.termId),
    classSessionIdIdx: index('kse_class_session_id_idx').on(
      table.classSessionId
    ),
    uniqueKidEnrollment: unique('kid_term_class_session').on(
      table.kidId,
      table.termId,
      table.classSessionId
    ),
  })
);

export const kidSessionEnrollmentRelations = relations(
  kidSessionEnrollment,
  ({ one }) => ({
    kid: one(kid, {
      fields: [kidSessionEnrollment.kidId],
      references: [kid.id],
    }),
    term: one(term, {
      fields: [kidSessionEnrollment.termId],
      references: [term.id],
    }),
    classSession: one(classSession, {
      fields: [kidSessionEnrollment.classSessionId],
      references: [classSession.id],
    }),
  })
);
