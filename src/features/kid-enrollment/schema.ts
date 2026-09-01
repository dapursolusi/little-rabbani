import { ENROLLMENT_STATUS } from '@/db/schema';
import z from 'zod';

export const BaseKidEnrollmentSchema = z.object({
  termId: z.string().min(1, 'Pilih batch wajib diisi'),
  classSessionId: z.string().min(1, 'Pilih sesi wajib diisi'),
});

export const CreateKidEnrollmentSchema = BaseKidEnrollmentSchema.extend({
  kids: z.array(
    z.object({
      id: z.string().min(1, 'Pilih murid wajib diisi'),
      status: z.enum(ENROLLMENT_STATUS).default('enrolled'),
    })
  ),
});

export const UpdateKidEnrollmentSchema = BaseKidEnrollmentSchema.extend({
  kidId: z.string().min(1, 'Pilih murid wajib diisi'),
  status: z.enum(ENROLLMENT_STATUS).default('enrolled'),
});

export type CreateKidEnrollmentInput = z.infer<
  typeof CreateKidEnrollmentSchema
>;
export type UpdateKidEnrollmentInput = z.infer<
  typeof UpdateKidEnrollmentSchema
>;
