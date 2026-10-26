import z from 'zod';

export const monthlyReportSchema = z.object({
  termId: z.uuid('Batch harus dipilih'),
  classSessionId: z.uuid('Sesi kelas harus dipilih'),
});
