import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { classSession, term } from './enrollment';
import { dailyClassReport } from './reports';
import { subTheme } from './theme';

// ─────────────── Holiday ───────────────

export const holidaySourceEnum = pgEnum('holiday_source', ['manual', 'synced']);

export const holidayScopeEnum = pgEnum('holiday_scope', [
  'national',
  'custom',
  'term',
]);

export const holiday = pgTable(
  'holiday',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    termId: uuid('term_id').references(() => term.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    reason: text('reason').notNull(),
    source: holidaySourceEnum('source').notNull().default('manual'),
    scope: holidayScopeEnum('scope').notNull().default('custom'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    termIdIdx: index('holiday_term_idx').on(table.termId),
    uniqueHoliday: uniqueIndex('holiday_unique')
      .on(
        table.termId,
        table.startDate,
        table.endDate,
        table.reason,
        table.source
      )
      .where(sql`${table.deletedAt} IS NULL`),
    uniqueHolidayWithoutTerm: uniqueIndex('holiday_unique_no_term')
      .on(table.startDate, table.endDate, table.reason, table.source)
      .where(sql`${table.termId} is null`),
    holidayDateCheck: check('holiday_date_check', sql`start_date <= end_date`),
    holidayScopeTermCheck: check(
      'holiday_scope_term_check',
      sql`${table.scope} != 'term' OR ${table.termId} IS NOT NULL`
    ),
  })
);

export const holidayRelations = relations(holiday, ({ one }) => ({
  term: one(term, {
    fields: [holiday.termId],
    references: [term.id],
  }),
}));

// ─────────────── Calendar Event ───────────────

export const calendarEvent = pgTable(
  'calendar_event',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    classSessionId: uuid('class_session_id').references(() => classSession.id, {
      onDelete: 'cascade',
    }),
    subThemeId: uuid('sub_theme_id').references(() => subTheme.id, {
      onDelete: 'set null',
    }),
    indoor: boolean('indoor').notNull().default(false),
    name: text('name').notNull().default(''),
    location: text('location'),
    itemsToBring: text('items_to_bring'),
    permissionRequired: boolean('permission_required').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    classSessionIdIdx: index('calendar_event_class_session_id_idx').on(
      table.classSessionId
    ),
    subThemeIdIdx: index('calendar_event_sub_theme_idx').on(table.subThemeId),
    // ponytail: regular index, not unique — multiple items share a (date, classSessionId) group
    calendarEventDateClassSessionIdIdx: index(
      'calendar_event_date_class_session_id_idx'
    ).on(table.startDate, table.classSessionId),
    calendarEventDateCheck: check(
      'calendar_event_date_check',
      sql`start_date <= end_date`
    ),
  })
);

export const calendarEventRelations = relations(calendarEvent, ({ one }) => ({
  classSession: one(classSession, {
    fields: [calendarEvent.classSessionId],
    references: [classSession.id],
  }),
  subTheme: one(subTheme, {
    fields: [calendarEvent.subThemeId],
    references: [subTheme.id],
  }),
}));

// ─────────────── Daily Class Schedule ───────────────

export const dailyClassSchedule = pgTable(
  'daily_class_schedule',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    termId: uuid('term_id')
      .notNull()
      .references(() => term.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    subThemeId: uuid('sub_theme_id')
      .notNull()
      .references(() => subTheme.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    objective: text('objective'),
    isIndoor: boolean('indoor').notNull().default(true),
    itemsToBring: text('items_to_bring'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    termIdIdx: index('dcs_term_idx').on(table.termId),
    subThemeIdIdx: index('dcs_sub_theme_idx').on(table.subThemeId),
    uniqueSchedule: uniqueIndex('dcs_unique')
      .on(table.termId, table.sortOrder)
      .where(sql`${table.deletedAt} IS NULL`),
  })
);

export const dailyClassScheduleRelations = relations(
  dailyClassSchedule,
  ({ one, many }) => ({
    term: one(term, {
      fields: [dailyClassSchedule.termId],
      references: [term.id],
    }),
    subTheme: one(subTheme, {
      fields: [dailyClassSchedule.subThemeId],
      references: [subTheme.id],
    }),
    dailyClassReports: many(dailyClassReport),
  })
);
