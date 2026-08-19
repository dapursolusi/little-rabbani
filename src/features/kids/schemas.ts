import { GENDERS, GUARDIAN_RELATIONSHIPS } from '@/db/schema';
import z from 'zod';

// Phone = guardian identity (ADR-0001): local Indonesian, no country code.
const phoneRegex = /^08\d{8,}$/;

const normalizeEmail = (v: string) => v.trim().toLowerCase();

/** Optional email: empty string → null; otherwise trim, lowercase, validate. */
const emailOptional = z
  .union([z.literal(''), z.string()])
  .transform((v) => (v === '' ? null : normalizeEmail(v)))
  .refine((v) => v === null || /.+@.+\..+/.test(v), {
    message: 'Format email tidak valid',
  });

const GuardianBaseSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wali wajib diisi'),
  phone: z
    .string()
    .min(1, 'Nomor telepon wajib diisi')
    .regex(phoneRegex, 'Format nomor: 08xxxxxxxxxx'),
  email: emailOptional.optional(),
  secondContactName: z.string().nullable().optional(),
  secondContactPhone: z.string().nullable().optional(),
});
// ponytail: DB columns for secondContact* are nullable; form fields marked
// required:false; RHF leaves them undefined when untouched → schema must allow
// undefined/null. `min(1)` inside the optional chain rejects '' for the user.

const CreateGuardianSchema = GuardianBaseSchema;

const UpdateGuardianSchema = GuardianBaseSchema.extend({
  id: z.string().min(1, 'ID wali wajib diisi'),
});

const BaseKidSchema = z.object({
  name: z.string().min(2, 'Nama lengkap murid wajib diisi'),
  nickName: z.string().nullable().optional(),
  gender: z.enum(GENDERS, { message: 'Jenis kelamin wajib diisi' }),
  dob: z.string().min(1, 'Tanggal lahir wajib diisi'),
  relationship: z.enum(GUARDIAN_RELATIONSHIPS, {
    message: 'Hubungan dengan wali wajib diisi',
  }),
});
// ponytail: nickName is optional in the form (required:false) and nullable in
// the DB, but z.string().min(2) rejects '' / undefined → made nullable+optional
// so untouched fields pass through; empty string coerces to null on insert.

const CreateKidSchema = BaseKidSchema;

const UpdateKidSchema = BaseKidSchema.extend({
  id: z.string().min(1, 'ID murid wajib diisi'),
  guardianId: z.string().min(1, 'ID Wali murid wajib diisi'),
});

/** Combined kid + guardian form (ADR-0001: phone = guardian identity). */
const KidGuardianFormSchema = z.object({
  kid: BaseKidSchema,
  guardian: GuardianBaseSchema,
});

export {
  CreateGuardianSchema,
  CreateKidSchema,
  KidGuardianFormSchema,
  UpdateGuardianSchema,
  UpdateKidSchema,
};

export type CreateGuardianInput = z.infer<typeof CreateGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof UpdateGuardianSchema>;

export type CreateKidInput = z.infer<typeof CreateKidSchema>;
export type UpdateKidInput = z.infer<typeof UpdateKidSchema>;

export type KidGuardianFormInput = z.infer<typeof KidGuardianFormSchema>;
