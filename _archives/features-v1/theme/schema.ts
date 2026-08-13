import { z } from 'zod/v4';

export const themeFormSchema = z.object({
  name: z.string().min(1, 'Nama tema wajib diisi'),
  color: z.string().optional(),
});

export const subThemeFormSchema = z.object({
  name: z.string().min(1, 'Nama sub tema wajib diisi'),
  themeId: z.uuid('ID tema tidak valid'),
});
