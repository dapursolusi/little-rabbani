import { ActionResult } from '@/types';
import { isWithinEditWindow } from '@/utils/date';
import { getLocalDateString } from '@/utils/date-local';

import { dcrRepo } from '../repositories';
import { DailyClassReport } from '../types';
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
    console.error('checkExistingDCR', error);
    return { success: false as const, error: 'Gagal memuat laporan harian' };
  }
}

export async function saveDCR(input: DailyClassReportInput) {
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
      dcrId: existingDCRResults.data?.id as string,
    });
    return {
      success: true as const,
      message: 'Berhasil menyimpan laporan harian',
      data: updated,
    };
  } catch (error) {
    console.error('saveDCR: ', error);
    return { success: false as const, error: 'Gagal menyimpan laporan harian' };
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
        error: `Laporan harian tanggal ${date} tidak ditemukan / belum dibuat`,
      };
    }

    return { success: true as const, data: dcr };
  } catch (error) {
    console.error('getDCRByDate', error);
    return {
      success: false as const,
      error: 'Gagal memuat data laporan harian',
    };
  }
}

export async function getDCRs(input: {
  classSessionId?: string;
  date?: { year?: number; month?: number };
}): Promise<ActionResult<DailyClassReport[]>> {
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
      data: dcrs as DailyClassReport[],
    };
  } catch (error) {
    console.error('getDCRs :', error);
    return {
      success: false as const,
      message: 'Gagal memuat data kegiatan harian',
    };
  }
}
