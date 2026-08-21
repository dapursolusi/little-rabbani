import z from 'zod';

const TermSchema = z.object({
  name: z.string().min(1, 'Nama Batch wajib diisi'),
  startDate: z.iso.date('Tanggal mulai wajib diisi'),
  endDate: z.iso.date('Tanggal selesai wajib diisi'),
});

export { TermSchema };

export type TermInput = z.infer<typeof TermSchema>;
