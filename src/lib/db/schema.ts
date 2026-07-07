import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const activityCategoryEnum = pgEnum('activity_category', [
  'seni',
  'olahraga',
  'musik',
  'bahasa',
  'matematika',
  'sains',
  'agama',
  'bermain',
  'outing',
  'lainnya',
]);

export const roleEnum = pgEnum('role', ['owner', 'teacher']);
export const kidStatusEnum = pgEnum('kid_status', [
  'waiting',
  'enrolled',
  'alumni',
]);

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: roleEnum('role').notNull().default('teacher'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const guardian = pgTable('guardian', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  secondContactName: text('second_contact_name'),
  secondContactPhone: text('second_contact_phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const term = pgTable('term', {
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
});

export const kid = pgTable('kid', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  dob: date('dob').notNull(),
  status: kidStatusEnum('status').notNull().default('waiting'),
  guardianId: uuid('guardian_id')
    .notNull()
    .references(() => guardian.id, { onDelete: 'restrict' }),
  enrolledTermId: uuid('enrolled_term_id').references(() => term.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const termSession = pgTable('term_session', {
  id: uuid('id').defaultRandom().primaryKey(),
  termId: uuid('term_id')
    .notNull()
    .references(() => term.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  label: text('label').notNull(),
  isHoliday: boolean('is_holiday').notNull().default(false),
  holidayReason: text('holiday_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Relations

export const guardianRelations = relations(guardian, ({ many }) => ({
  kids: many(kid),
}));

export const kidRelations = relations(kid, ({ one }) => ({
  guardian: one(guardian, {
    fields: [kid.guardianId],
    references: [guardian.id],
  }),
  enrolledTerm: one(term, {
    fields: [kid.enrolledTermId],
    references: [term.id],
  }),
}));

export const termRelations = relations(term, ({ many }) => ({
  kids: many(kid),
  sessions: many(termSession),
}));

export const activity = pgTable('activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: activityCategoryEnum('category').notNull().default('lainnya'),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const scheduleItemTypeEnum = pgEnum('schedule_item_type', [
  'activity',
  'outing',
]);

export const scheduleItem = pgTable('schedule_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => termSession.id, { onDelete: 'cascade' }),
  activityId: uuid('activity_id').references(() => activity.id, {
    onDelete: 'set null',
  }),
  type: scheduleItemTypeEnum('type').notNull(),
  outingLocation: text('outing_location'),
  outingBringItems: text('outing_bring_items'),
  outingPermissionRequired: boolean('outing_permission_required')
    .notNull()
    .default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const termSessionRelations = relations(termSession, ({ one, many }) => ({
  term: one(term, {
    fields: [termSession.termId],
    references: [term.id],
  }),
  scheduleItems: many(scheduleItem),
}));

export const scheduleItemRelations = relations(scheduleItem, ({ one }) => ({
  session: one(termSession, {
    fields: [scheduleItem.sessionId],
    references: [termSession.id],
  }),
  activity: one(activity, {
    fields: [scheduleItem.activityId],
    references: [activity.id],
  }),
}));
