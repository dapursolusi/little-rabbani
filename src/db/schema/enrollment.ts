import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { table } from 'node:console';

import { kid } from './kids';

export const term = pgTable(
  'term',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    isAutoCreated: boolean('is_auto_created').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [check('check_date', sql`${table.startDate} < ${table.endDate}`)]
);

export const termRelations = relations(term, ({ many }) => ({
  kidEnrollments: many(kidEnrollment),
}));

export const classSession = pgTable(
  'class_session',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [check('check_time', sql`${table.startTime} < ${table.endTime}`)]
);

export const classSessionRelations = relations(classSession, ({ many }) => ({
  sessionEnrollments: many(kidEnrollment),
}));

export const ENROLLMENT_STATUS = ['waiting', 'enrolled'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[number];
export const enrollmentStatusEnum = pgEnum(
  'enrollment_status',
  ENROLLMENT_STATUS
);
export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  waiting: 'Dalam Waiting List',
  enrolled: 'Terdaftar',
};

export const kidEnrollment = pgTable(
  'kid_enrollment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    termId: uuid('term_id')
      .notNull()
      .references(() => term.id, { onDelete: 'no action' }),
    classSessionId: uuid('class_session_id')
      .notNull()
      .references(() => classSession.id, { onDelete: 'no action' }),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'no action' }),
    status: enrollmentStatusEnum('status').notNull().default('enrolled'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('kid_enrollment_kid_id_idx').on(table.kidId),
    index('kid_enrollment_term_id_idx').on(table.termId),
    index('kid_enrollment_class_session_id_idx').on(table.classSessionId),
  ]
);

export const kidEnrollmentRelations = relations(kidEnrollment, ({ one }) => ({
  kid: one(kid, {
    fields: [kidEnrollment.kidId],
    references: [kid.id],
  }),
  term: one(term, {
    fields: [kidEnrollment.termId],
    references: [term.id],
  }),
  classSession: one(classSession, {
    fields: [kidEnrollment.classSessionId],
    references: [classSession.id],
  }),
}));
