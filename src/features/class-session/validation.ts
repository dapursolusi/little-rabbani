import z from 'zod';

const OverlappingClassSessionFields = {
  startTime: z.iso.time('Jam mulai wajib diisi'),
  endTime: z.iso.time('Jam selesai wajib diisi'),
};

const OverlappingClassSessionSchema = z
  .object(OverlappingClassSessionFields)
  .refine((data) => data.endTime > data.startTime, {
    message: 'Jam selesai harus setelah jam mulai',
    path: ['endTime'],
  });

const ClassSessionSchema = z
  .object({
    name: z.string().min(1, 'Nama sesi wajib diisi'),
    ...OverlappingClassSessionFields,
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'Jam selesai harus setelah jam mulai',
    path: ['endTime'],
  });

export { ClassSessionSchema, OverlappingClassSessionSchema };

export type ClassSessionInput = z.infer<typeof ClassSessionSchema>;
export type OverlappingClassSessionInput = z.infer<
  typeof OverlappingClassSessionSchema
>;
