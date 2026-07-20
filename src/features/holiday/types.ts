import { BaseDataResponse } from '@/types';

export interface Holiday extends BaseDataResponse {
  termId: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  source: 'manual' | 'synced';
  scope: 'national' | 'custom' | 'term';
}
