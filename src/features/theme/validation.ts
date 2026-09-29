import { z } from 'zod/v4';

export const themeSchema = z.object({
  name: z.string().min(1, 'Nama tema wajib diisi'),
});

export const subThemeSchema = z.object({
  name: z.string().min(1, 'Nama sub tema wajib diisi'),
  themeId: z.uuid('ID tema tidak valid'),
});

// Aliases for actions.ts which imports themeFormSchema / subThemeFormSchema
export const themeFormSchema = themeSchema;
export const subThemeFormSchema = subThemeSchema;

export type ThemeInput = z.infer<typeof themeSchema>;
export type SubThemeInput = z.infer<typeof subThemeSchema>;
