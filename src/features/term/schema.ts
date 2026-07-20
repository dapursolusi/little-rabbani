import z from 'zod';

const TermFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
});

export { TermFormSchema };

export type TermFormData = z.infer<typeof TermFormSchema>;
