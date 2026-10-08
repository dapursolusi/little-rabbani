import { dailyKidReport } from '@/db/schema';
import z from 'zod';

import {
  KID_APPETITE,
  KID_ATTENDANCE,
  KID_MOOD,
  REPORT_STATUS,
} from './constants';

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

export const DailyKidReportSchema = z
  .object({
    dcrObservationId: z.uuid('Harus berisi ID laporan harian'),
    narrative: z.string().optional(),
    statusReport: z.enum(REPORT_STATUS),
    sentAt: z.iso.date().optional(),
  })
  .refine((data) => data.statusReport === 'sent', {
    path: ['sentAt'],
    message: 'Tanggal dikirim haru diisi',
  });

export type DailyKidReportInput = z.infer<typeof DailyKidReportSchema>;

export type DailyClassReportInput = z.infer<typeof dailyClassReportSchema>;

export type DCRObservationInput = z.infer<typeof dcrObservationSchema>;
