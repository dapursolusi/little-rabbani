import { relations, sql } from 'drizzle-orm';
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ─────────────── Guardian / Parent ───────────────

export const guardian = pgTable(
  'guardian',
  {
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
    deletedAt: timestamp('deleted_at'),
  },
  // Partial unique indexes: soft-deleted guardians keep their phone/email
  // reserved but FREE it for reuse (live-only uniqueness). The seam's
  // collision checks match these constraints (live rows only).
  (table) => ({
    phoneIdx: uniqueIndex('guardian_phone_unique_live')
      .on(table.phone)
      .where(sql`${table.deletedAt} is null`),
    emailIdx: uniqueIndex('guardian_email_unique_live')
      .on(table.email)
      .where(sql`${table.deletedAt} is null and ${table.email} is not null`),
  })
);

export const guardianRelations = relations(guardian, ({ many }) => ({
  kids: many(kid),
}));

// ─────────────── Kids ───────────────

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];
export const genderEnum = pgEnum('gender', GENDERS);
export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Laki-laki',
  female: 'Perempuan',
};

export const GUARDIAN_RELATIONSHIPS = [
  'mother',
  'father',
  'older_sibling',
  'grandparent',
  'aunt_uncle',
  'other',
] as const;
export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];
export const guardianRelationshipEnum = pgEnum(
  'guardian_relationship',
  GUARDIAN_RELATIONSHIPS
);
export const GUARDIAN_RELATIONSHIP_LABELS: Record<
  GuardianRelationship,
  string
> = {
  mother: 'Ibu',
  father: 'Ayah',
  older_sibling: 'Kakak',
  grandparent: 'Kakek / Nenek',
  aunt_uncle: 'Bibi / Paman',
  other: 'Wali',
};

export const kid = pgTable(
  'kid',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    nickName: text('nickname'),
    gender: genderEnum('gender').notNull(),
    dob: date('dob').notNull(),
    guardianId: uuid('guardian_id')
      .notNull()
      .references(() => guardian.id, { onDelete: 'restrict' }),
    relationship: guardianRelationshipEnum('relationship').notNull(),
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

export const kidRelations = relations(kid, ({ one }) => ({
  guardian: one(guardian, {
    fields: [kid.guardianId],
    references: [guardian.id],
  }),
}));
