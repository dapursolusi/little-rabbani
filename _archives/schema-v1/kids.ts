import { relations } from 'drizzle-orm';
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { kidSessionEnrollment } from './enrollment';
import { observation } from './observation';
import {
  dailyKidReportSnapshot,
  monthlyKidReportSnapshot,
  quarterlyKidReportSnapshot,
} from './reports';

// ─────────────── Guardian / Parent ───────────────

export const guardian = pgTable('guardian', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  email: text('email').unique(),
  secondContactName: text('second_contact_name'),
  secondContactPhone: text('second_contact_phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const guardianRelations = relations(guardian, ({ many }) => ({
  kids: many(kid),
}));

// ─────────────── Kids ───────────────

export const kidEnrollmentStatusEnum = pgEnum('kid_status', [
  'waiting',
  'enrolled',
  'alumni',
]);

export const kid = pgTable(
  'kid',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    dob: date('dob').notNull(),
    status: kidEnrollmentStatusEnum('status').notNull().default('waiting'),
    guardianId: uuid('guardian_id')
      .notNull()
      .references(() => guardian.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    guardianIdx: index('kid_guardian_idx').on(table.guardianId),
    kidNameDobUnique: unique('kid_name_dob_unique').on(table.name, table.dob),
  })
);

export const kidRelations = relations(kid, ({ one, many }) => ({
  guardian: one(guardian, {
    fields: [kid.guardianId],
    references: [guardian.id],
  }),
  sessionEnrollments: many(kidSessionEnrollment),
  observations: many(observation),
  dailyReportSnapshots: many(dailyKidReportSnapshot),
  monthlyReportSnapshots: many(monthlyKidReportSnapshot),
  quarterlyReportSnapshots: many(quarterlyKidReportSnapshot),
}));
