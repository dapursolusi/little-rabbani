import { scheduleItemTypeEnum } from '@/db/schema';

export type ScheduleItemType = (typeof scheduleItemTypeEnum.enumValues)[number];
