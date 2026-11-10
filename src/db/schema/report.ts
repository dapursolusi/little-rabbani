import {
  MONTHLY_REPORT_STATUS,
  MONTHLY_REPORT_STATUS_VALUES,
} from '@/features/report/constants';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth';
import { term } from './enrollment';
import { kid } from './kids';

export const reportTemplate = pgTable('report_template', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const monthlyKidReportEnum = pgEnum(
  'monthly_report_status',
  MONTHLY_REPORT_STATUS_VALUES
);

export const monthlyKidReport = pgTable(
  'monthly_kid_report',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kidId: uuid('kid_id')
      .notNull()
      .references(() => kid.id, { onDelete: 'cascade' }),
    termId: uuid('term_id')
      .notNull()
      .references(() => term.id, { onDelete: 'cascade' }),
    month: text('month').notNull(),
    narrative: text('narrative'),
    reportStatus: monthlyKidReportEnum('report_status')
      .notNull()
      .default(MONTHLY_REPORT_STATUS.DRAFT),
    /** Teacher changed the generated content — independent of lifecycle. */
    isEdited: boolean('is_edited').notNull().default(false),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    sentBy: text('sent_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('mkr_kid_id_idx').on(table.kidId),
    index('mkr_term_id_idx').on(table.termId),
    index('mkr_sent_by_idx').on(table.sentBy),
    uniqueIndex('monthly_kid_report_kid_term_month_uniq').on(
      table.kidId,
      table.termId,
      table.month
    ),
  ]
);

export const monthlyKidReportRelations = relations(
  monthlyKidReport,
  ({ one }) => ({
    kid: one(kid, {
      fields: [monthlyKidReport.kidId],
      references: [kid.id],
    }),
    term: one(term, {
      fields: [monthlyKidReport.termId],
      references: [term.id],
    }),
    sentByUser: one(user, {
      fields: [monthlyKidReport.sentBy],
      references: [user.id],
    }),
  })
);
