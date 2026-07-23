import { scheduleItemTypeEnum } from '@/db/schema';
import z from 'zod';

const scheduledActivitySchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  activityId: z.uuid(),
  sessionTypeId: z.uuid(),
  type: z.enum(scheduleItemTypeEnum.enumValues),
  location: z.string().nullish(),
  itemsToBring: z.string().nullish(),
  permissionRequired: z.boolean().nullish(),
});

export { scheduledActivitySchema };

export type ScheduleActivity = z.infer<typeof scheduledActivitySchema>;
