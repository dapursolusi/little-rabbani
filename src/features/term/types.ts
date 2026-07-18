import { BaseDataResponse } from '@/types';

import { TermSession } from '../session/types';

export interface Term extends BaseDataResponse {
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sessions: TermSession[];
}
