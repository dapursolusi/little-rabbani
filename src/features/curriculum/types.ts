import type { BaseDataResponse } from '@/types';

export interface Curriculum extends BaseDataResponse {
  termId: string;
  sortOrder: number;
  subThemeId: string;
  name: string;
  objective: string | null;
  indoor: boolean;
  itemsToBring: string | null;
  subTheme?: { id: string; name: string; theme?: { name: string } } | null;
}
