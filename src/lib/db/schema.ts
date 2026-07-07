import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

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
}));
