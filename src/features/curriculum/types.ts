import type { BaseDataResponse } from '@/types';

import type { CurriculumFormData } from './schema';

export interface Curriculum extends BaseDataResponse, CurriculumFormData {
  termId: string;
  sortOrder: number;
  subTheme?: { id: string; name: string; theme?: { name: string } } | null;
}
