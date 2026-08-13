import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { calendarEvent, dailyClassSchedule } from './calendar';

// ─────────────── Theme/Sub-Theme ───────────────

export const theme = pgTable('theme', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const themeRelations = relations(theme, ({ many }) => ({
  subThemes: many(subTheme),
}));

export const subTheme = pgTable(
  'sub_theme',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => theme.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    themeIdIdx: index('sub_theme_theme_idx').on(table.themeId),
  })
);

export const subThemeRelations = relations(subTheme, ({ one, many }) => ({
  theme: one(theme, {
    fields: [subTheme.themeId],
    references: [theme.id],
  }),
  dailyClassSchedules: many(dailyClassSchedule),
  calendarEvents: many(calendarEvent),
}));
