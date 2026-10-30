import { ActionResult } from '@/types';
import { getLocalDateString, isWithinEditWindow } from '@/utils/date';

import { logger } from '@/lib/logger';

import { dcrRepo } from '../repositories';
import { DailyClassReportList, DailyClassReportRecord } from '../types';
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
  try {
    const dcr = await dcrRepo.findDCR({ date, classSessionId });

    if (!dcr) {
      return {
        success: false as const,
        message: `Laporan harian tanggal ${date} tidak ditemukan / belum dibuat`,
      };
    }

    return { success: true as const, data: dcr };
  } catch (error) {
    logger.error({ err: error }, 'getDCRByDate');
    return {
      success: false as const,
      message: 'Gagal memuat data laporan harian',
    };
  }
}

export async function getDCRs(input: {
  classSessionId?: string;
  date?: { year?: number; month?: number };
}): Promise<ActionResult<DailyClassReportList>> {
  try {
    const defaultYear = Number(getLocalDateString().slice(0, 4));
    const dcrs = await dcrRepo.findMany({
      date: {
        year: input.date?.year ?? defaultYear,
        month: input.date?.month,
      },
    });
    return {
      success: true as const,
      data: dcrs,
    };
  } catch (error) {
    logger.error({ err: error }, 'getDCRs');
    return {
      success: false as const,
      message: 'Gagal memuat data kegiatan harian',
    };
  }
}
