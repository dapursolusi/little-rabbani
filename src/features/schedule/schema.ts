import { activityCategoryEnum, scheduleItemTypeEnum } from '@/db/schema';
import z from 'zod';

const scheduledActivitySchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi'),
    isMultipleDays: z.boolean(),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    endDate: z.string().nullish(),
    category: z.enum(activityCategoryEnum.enumValues),
    sessionTypeId: z.uuid(),
    type: z.enum(scheduleItemTypeEnum.enumValues),
    location: z.string().nullish(),
    itemsToBring: z.string().nullish(),
    permissionRequired: z.boolean().nullish(),
  })
  .refine(
    (data) => {
      if (!data.isMultipleDays) return true;
      return data.endDate && data.startDate < data.endDate;
    },
    {
      message: 'Tanggal selesai harus setelah tanggal mulai',
      path: ['endDate'],
    }
  );

export { scheduledActivitySchema };

export type ScheduleActivity = z.infer<typeof scheduledActivitySchema>;
