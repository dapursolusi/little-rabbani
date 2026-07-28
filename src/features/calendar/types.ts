import { BaseDataResponse } from '@/types';
import z from 'zod';

import { SessionType } from '../sessionType/types';
import { SubTheme } from '../theme/types';
import { calendarEventSchema } from './schema';

export type CalendarEventFormData = z.infer<typeof calendarEventSchema>;

export type CalendarEvent = BaseDataResponse &
  Omit<CalendarEventFormData, 'isMultipleDays'> & {
    subTheme: SubTheme;
    sessionType: SessionType;
    sortOrder: number;
  };
