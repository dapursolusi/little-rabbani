import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const reportTemplate = pgTable('report_template', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
