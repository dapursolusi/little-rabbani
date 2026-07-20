import { BaseDataResponse } from '@/types';

import { TermSession } from '../session/types';
import { TermFormData } from './schema';

export interface Term extends BaseDataResponse, TermFormData {
  isActive: boolean;
  sessions: TermSession[];
}
