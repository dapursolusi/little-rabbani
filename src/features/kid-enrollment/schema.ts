import { ENROLLMENT_STATUS } from '@/db/schema';
import z from 'zod';

export const KidEnrollmentSchema = z.object({
  termId: z.string().min(1, 'Pilih batch wajib diisi'),
  classSessionId: z.string().min(1, 'Pilih sesi wajib diisi'),
  kids: z.array(
    z.object({
      id: z.string().min(1, 'Pilih murid wajib diisi'),
      status: z.enum(ENROLLMENT_STATUS).default('enrolled'),
    })
  ),
});

export type KidEnrollmentInput = z.infer<typeof KidEnrollmentSchema>;
