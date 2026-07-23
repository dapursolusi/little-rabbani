import type { BaseDataResponse } from '@/types';
import type { z } from 'zod/v4';

import type { SubThemeFormSchema, ThemeFormSchema } from './schema';

export interface Theme extends BaseDataResponse {
  name: string;
  color: string | null;
}

export interface SubTheme extends BaseDataResponse {
  name: string;
  themeId: string;
}

export type ThemeFormData = z.infer<typeof ThemeFormSchema>;
export type SubThemeFormData = z.infer<typeof SubThemeFormSchema>;
