import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import { ActionResult } from '@/types';
import { getLocalDateString, isWithinEditWindow } from '@/utils/date';
import z from 'zod';

import { parseInput } from '@/lib/actions/parse-input';
import { KidNotEnrolledError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { uuidSchema } from '@/lib/validation/common.schema';

import { dcrRepo } from '../repositories';
import { DailyClassReportRecord } from '../types';
import { DailyClassReportInput } from '../validation';

export async function getOrCreateDCR({
  classSessionId,
}: {
  classSessionId: string;
}) {
  try {
    const iso = getLocalDateString();

    const existing = await dcrRepo.findDCR({ date: iso, classSessionId });
    if (existing) return { success: true as const, data: existing };

    const dcr = await dcrRepo.insert({ date: iso, classSessionId });
    return { success: true as const, data: dcr };
  } catch (error) {
    logger.error({ err: error }, 'checkExistingDCR');
    return { success: false as const, message: 'Gagal memuat laporan harian' };
  }
}

export async function getDcrsByMonth(input: {
  classSessionId: string;
  month: string;
}) {
  return await dcrRepo.findManyByMonth(input);
}

export async function getDcrsWithObservationsByKidAndMonth(input: {
  kidId: string;
  termId: string;
  yearMonth: string;
}) {
  const enrollment = await kidEnrollmentService.verifyKidEnrollment({
    kidId: input.kidId,
    termId: input.termId,
  });

  if (!enrollment) {
    throw new KidNotEnrolledError();
  }

  return await dcrRepo.findManyWithObservationsByKidAndMonth({
    kidId: input.kidId,
    classSessionId: enrollment.classSessionId,
    yearMonth: input.yearMonth,
  });
}

export async function saveDCR(
  input: DailyClassReportInput
): Promise<ActionResult<DailyClassReportRecord>> {
  try {
    if (input.date && !isWithinEditWindow(input.date)) {
      return {
        success: false as const,
        message: 'Periode edit laporan harian sudah lewat (maksimal 7 hari)',
      };
    }

    const existingDCRResults = await getOrCreateDCR({
      classSessionId: input.classSessionId,
    });

    const updated = await dcrRepo.update({
      input,
      dcrId: existingDCRResults.data?.id ?? '',
    });
    return {
      success: true as const,
      message: 'Berhasil menyimpan laporan harian',
      data: updated,
    };
  } catch (error) {
    logger.error({ err: error }, 'saveDCR');
    return {
      success: false as const,
      message: 'Gagal menyimpan laporan harian',
    };
  }
}

export async function getDCRByDate(
  date: string,
  { classSessionId }: { classSessionId?: string }
) {
  return dcrRepo.findDCR({ date, classSessionId });
}

export async function getDCRs(input: {
  classSessionId?: string;
  date?: { year?: number; month?: number };
}) {
  const parsed = parseInput({
    input,
    schema: z.object({
      classSessionId: uuidSchema.optional(),
      date: z
        .object({
          year: z.number().int().min(2025).max(2100).optional(),
          month: z.number().int().min(1).max(12).optional(),
        })
        .optional(),
    }),
    fallbackError: 'getDCRs: Opsi input tidak valid',
  });
  if (!parsed.success) throw new Error(parsed.message);
  const defaultYear = Number(getLocalDateString().slice(0, 4));
  const dcrs = await dcrRepo.findMany({
    date: {
      year: input.date?.year ?? defaultYear,
      month: input.date?.month,
    },
  });
  return dcrs;
}
