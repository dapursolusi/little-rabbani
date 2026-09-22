import type { BaseDTOResponse } from '@/types';

export interface Theme extends BaseDTOResponse {
  name: string;
  subThemes?: Array<{ id: string; name: string }>;
}

export interface SubTheme extends BaseDTOResponse {
  name: string;
  themeId: string;
  theme?: { id: string; name: string };
}
