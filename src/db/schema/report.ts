import { MONTHLY_REPORT_STATUS } from '@/features/report/constants';
import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
  MONTHLY_REPORT_STATUS
);

export const monthlyKidReport = pgTable('monthly_kid_report', {
  id: uuid('id').defaultRandom().primaryKey(),
  kidId: uuid('kid_id')
    .notNull()
    .references(() => kid.id, { onDelete: 'cascade' }),
  termId: uuid('term_id')
    .notNull()
    .references(() => term.id, { onDelete: 'cascade' }),
  month: text('month').notNull(),
  narrative: text('narrative'),
  reportStatus: monthlyKidReportEnum('report_status').default('generated'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const monthlyKidReportRelationship = relations(
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
  })
);
