import { z } from 'zod/v4';

const calendarEventSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi'),
    isMultipleDays: z.boolean(),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    // ponytail: single-day events hide endDate from UI; adapter copies startDate -> endDate
    endDate: z.string().min(1).or(z.literal('')),
    subThemeId: z.uuid('Sub tema wajib dipilih'),
    sessionTypeId: z.uuid(),
    indoor: z.boolean(),
    location: z.string().nullish(),
    itemsToBring: z.string().nullish(),
    permissionRequired: z.boolean().nullish(),
    sortOrder: z.number().nullish(),
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

export { calendarEventSchema };
