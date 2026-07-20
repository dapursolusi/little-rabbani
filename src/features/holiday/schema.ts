import z from 'zod';

const HolidayFormSchema = z
  .object({
    termId: z.string().optional(),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
    reason: z.string().min(1, 'Alasan libur wajib diisi'),
    scope: z.enum(['national', 'custom', 'term']).default('custom'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai',
    path: ['endDate'],
  });

export { HolidayFormSchema };
export type HolidayFormData = z.infer<typeof HolidayFormSchema>;
