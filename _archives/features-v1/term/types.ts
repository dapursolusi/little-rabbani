import { BaseDataResponse } from '@/types';

import { TermFormData } from './schema';

export interface Term extends BaseDataResponse, TermFormData {
  isActive: boolean;
}
