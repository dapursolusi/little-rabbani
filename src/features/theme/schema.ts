import { z } from 'zod/v4';

export const ThemeFormSchema = z.object({
  name: z.string().min(1, 'Nama tema wajib diisi'),
  color: z.string().optional(),
});

export const SubThemeFormSchema = z.object({
  name: z.string().min(1, 'Nama sub tema wajib diisi'),
  themeId: z.string().uuid('ID tema tidak valid'),
});
