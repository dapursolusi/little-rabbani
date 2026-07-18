import z from 'zod';

const SessionFormSchema = z.object({
  termId: z.string().min(1, 'Term wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  startTime: z.string().min(1, 'Jam mulai wajib diisi'),
  endTime: z.string().min(1, 'Jam selesai wajib diisi'),
  label: z.string().min(1, 'Label wajib diisi'),
  isHoliday: z.string().optional(),
  holidayReason: z.string().optional(),
});

export { SessionFormSchema };

export type SessionFormData = z.infer<typeof SessionFormSchema>;
