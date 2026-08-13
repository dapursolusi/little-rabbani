import { BaseDataResponse } from '@/types';

export interface ClassSession extends BaseDataResponse {
  name: string;
  start: string;
  end: string;
  active: boolean;
}
