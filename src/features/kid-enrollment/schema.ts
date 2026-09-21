import { ENROLLMENT_STATUS } from '@/db/schema';
import z from 'zod';

export const BaseKidEnrollmentSchema = z.object({
  termId: z.string().min(1, 'Pilih batch wajib diisi'),
  classSessionId: z.string().min(1, 'Pilih sesi wajib diisi'),
});

export const KidToBeEnrolledSchema = z.object({
  kidId: z.string().min(1, 'Pilih murid wajib diisi'),
  status: z.enum(ENROLLMENT_STATUS).default('enrolled'),
});

export const KidEnrollmentSchema = BaseKidEnrollmentSchema.extend({
  kids: z.array(KidToBeEnrolledSchema),
});

export const EnrollmentUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ENROLLMENT_STATUS),
});

export const SaveEnrollmentChangesSchema = BaseKidEnrollmentSchema.extend({
  created: z.array(KidToBeEnrolledSchema).default([]),
  updated: z.array(EnrollmentUpdateSchema).default([]),
  deleted: z.array(z.string()).default([]),
});

export type KidToBeEnrolled = z.infer<typeof KidToBeEnrolledSchema>;

export type KidEnrollmentInput = z.infer<typeof KidEnrollmentSchema>;

export type SaveEnrollmentChangesInput = z.infer<
  typeof SaveEnrollmentChangesSchema
>;
