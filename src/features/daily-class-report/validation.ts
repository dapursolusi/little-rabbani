import z from 'zod';

import {
  KID_APPETITE_VALUES,
  KID_ATTENDANCE,
  KID_ATTENDANCE_VALUES,
  KID_MOOD_VALUES,
  REPORT_STATUS,
  REPORT_STATUS_VALUES,
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
    attendance: z.enum(KID_ATTENDANCE_VALUES, {
      message: 'Kehadiran wajib diisi',
    }),
    mood: z.enum(KID_MOOD_VALUES).optional(),
    appetite: z.enum(KID_APPETITE_VALUES).optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      data.attendance !== KID_ATTENDANCE.PRESENT || data.mood !== undefined,
    {
      path: ['mood'],
      message: 'Mood wajib diisi jika anak hadir',
    }
  )
  .refine(
    (data) =>
      data.attendance !== KID_ATTENDANCE.PRESENT || data.appetite !== undefined,
    {
      path: ['appetite'],
      message: 'Porsi yang dimakan wajib diisi jika anak hadir',
    }
  );

export const DailyKidReportSchema = z
  .object({
    dcrObservationId: z.uuid('Harus berisi ID laporan harian'),
    narrative: z.string().nullish(),
    reportStatus: z.enum(REPORT_STATUS_VALUES),
    sentAt: z.date().nullish(),
  })
  .refine((data) => data.reportStatus !== REPORT_STATUS.SENT || !!data.sentAt, {
    path: ['sentAt'],
    message: 'Tanggal dikirim harus diisi',
  });

export type DailyKidReportInput = z.infer<typeof DailyKidReportSchema>;

export type DailyClassReportInput = z.infer<typeof dailyClassReportSchema>;

export type DCRObservationInput = z.infer<typeof dcrObservationSchema>;
