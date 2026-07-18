import { BaseDataResponse } from '@/types';

export interface TermSession extends BaseDataResponse {
  date: string;
  termId: string;
  startTime: string;
  endTime: string;
  label: string;
  isHoliday: boolean;
  holidayReason: string | null;
}
