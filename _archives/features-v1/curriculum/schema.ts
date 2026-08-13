import z from 'zod';

const CurriculumItemSchema = z.object({
  subThemeId: z.string().uuid('Sub tema tidak valid'),
  name: z.string().min(1, 'Nama aktivitas wajib diisi'),
  objective: z.string().optional(),
  indoor: z.enum(['true', 'false']).default('false'),
  itemsToBring: z.string().optional(),
});

export { CurriculumItemSchema };
export type CurriculumFormData = z.infer<typeof CurriculumItemSchema>;
