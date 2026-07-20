import z from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const SessionTypeFormSchema = z
  .object({
    name: z.string().min(1, 'Nama sesi wajib diisi'),
    start: z.string().regex(TIME_REGEX, 'Format jam HH:mm'),
    end: z.string().regex(TIME_REGEX, 'Format jam HH:mm'),
  })
  .refine((data) => data.end > data.start, {
    message: 'Jam selesai harus setelah jam mulai',
    path: ['end'],
  });

export { SessionTypeFormSchema };
export type SessionTypeFormData = z.infer<typeof SessionTypeFormSchema>;
