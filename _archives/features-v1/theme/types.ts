import type { BaseDataResponse } from '@/types';
import type { z } from 'zod/v4';

import type { subThemeFormSchema, themeFormSchema } from './schema';

export interface Theme extends BaseDataResponse {
  name: string;
  color: string | null;
  subThemes?: Array<{ id: string; name: string }>;
}

export interface SubTheme extends BaseDataResponse {
  name: string;
  themeId: string;
  theme?: { id: string; name: string; color: string | null };
}

export type ThemeFormData = z.infer<typeof themeFormSchema>;
export type SubThemeFormData = z.infer<typeof subThemeFormSchema>;
