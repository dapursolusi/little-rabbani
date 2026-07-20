import { BaseDataResponse } from '@/types';

export interface SessionType extends BaseDataResponse {
  name: string;
  start: string;
  end: string;
  active: boolean;
}
