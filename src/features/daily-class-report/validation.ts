import z from 'zod';

import { KID_APPETITE, KID_ATTENDANCE, KID_MOOD } from './constants';

export const dailyClassReportSchema = z.object({
  classSessionId: z.uuid('Sesi kelas wajib dipilih'),
  subThemeId: z.uuid('Sub tema wajib dipilih').optional(),
  date: z.iso.date(),
  description: z.string().optional(),
});

export const dcrObservationSchema = z
  .object({
    dcrId: z.uuid('Harus berisi ID laporan harian'),
    kidId: z.uuid('Anak wajib dipilih'),
    attendance: z.enum(KID_ATTENDANCE, { message: 'Kehadiran wajib diisi' }),
    mood: z.enum(KID_MOOD).optional(),
    appetite: z.enum(KID_APPETITE).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.attendance !== 'present' || data.mood !== undefined, {
    path: ['mood'],
    message: 'Mood wajib diisi jika anak hadir',
  })
  .refine(
    (data) => data.attendance !== 'present' || data.appetite !== undefined,
    {
      path: ['appetite'],
      message: 'Porsi yang dimakan wajib diisi jika anak hadir',
    }
  );

export type DailyClassReportInput = z.infer<typeof dailyClassReportSchema>;

export type DCRObservationInput = z.infer<typeof dcrObservationSchema>;
