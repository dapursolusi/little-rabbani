import z from 'zod';

const ClassSessionSchema = z
  .object({
    name: z.string().min(1, 'Nama sesi wajib diisi'),
    startTime: z.iso.time('Jam mulai wajib diisi'),
    endTime: z.iso.time('Jam selesai wajib diisi'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'Jam selesai harus setelah jam mulai',
    path: ['endTime'],
  });

export { ClassSessionSchema };

export type ClassSessionInput = z.infer<typeof ClassSessionSchema>;
