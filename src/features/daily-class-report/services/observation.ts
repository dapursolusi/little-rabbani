import { ActionResult } from '@/types';
import { isWithinEditWindow } from '@/utils/date';

import { dcrService } from '.';
import * as kidService from '../../kid/services';
import { dcrRepo, observationRepo } from '../repositories';
import { DCRObservation } from '../types';
import { DCRObservationInput } from '../validation';

export async function createKidObservation({
  input,
  classSessionId,
}: {
  input: DCRObservationInput;
  classSessionId: string;
}): Promise<ActionResult<DCRObservation>> {
  try {
    if (!classSessionId)
      return {
        success: false as const,
        message: 'Wajib memilih sesi kelas terlebih dahulu',
      };
    const dcr = await dcrService.getOrCreateDCR({ classSessionId });
    if (!dcr.success)
      return {
        success: false as const,
        message: 'Gagal memuat laporan harian',
      };

    const existingToday = await observationRepo.findObservation({
      kidId: input.kidId,
      dcrId: dcr.data?.id,
    });

    const kidName = (await kidService.getKid(input.kidId)).data?.name;

    if (existingToday) {
      return {
        success: false as const,
        message: `Observasi untuk ${kidName} sudah ada untuk hari ini.`,
      };
    }

    const kidObservation = await observationRepo.insert({
      ...input,
      dcrId: dcr.data?.id,
    });
    return { success: true as const, data: kidObservation as DCRObservation };
  } catch (error) {
    console.error('createKidObservation', error);
    return {
      success: false as const,
      message: 'Gagal membuat observasi anak. Coba lagi nanti.',
    };
  }
}

export async function updateKidObservation(
  input: DCRObservationInput
): Promise<ActionResult<DCRObservation>> {
  try {
    const existing = await observationRepo.findObservation({
      dcrId: input.dcrId,
      kidId: input.kidId,
    });
    if (!existing)
      return { success: false as const, message: 'Observasi tidak ditemukan' };

    const dcr = await dcrRepo.findById(input.dcrId);
    if (!dcr)
      return {
        success: false as const,
        message: 'Laporan harian tidak ditemukan',
      };
    if (!isWithinEditWindow(dcr.date)) {
      return {
        success: false as const,
        message: 'Periode edit observasi sudah lewat (maksimal 7 hari)',
      };
    }

    const updated = await observationRepo.update(input);
    return {
      success: true as const,
      message: 'Berhasil mengupdate observasi',
      data: updated as DCRObservation,
    };
  } catch (error) {
    console.error('updateKidObservation: ', error);
    return {
      success: false as const,
      message: 'Gagal mengupdate observasi anak. Coba lagi beberapa saat.',
    };
  }
}

export async function getDCRObservationsByDcrId(
  dcrId: string
): Promise<ActionResult<DCRObservation[]>> {
  try {
    const observations = await observationRepo.findMany({ dcrId });
    return { success: true as const, data: observations };
  } catch (error) {
    console.error('getDCRObservationsByDcrId', error);
    return {
      success: false as const,
      message: 'Gagal memuat observasi anak. Coba lagi nanti.',
    };
  }
}

export async function getDCRObservationsByDate(
  date: string,
  { classSessionId }: { classSessionId?: string }
): Promise<ActionResult<DCRObservation[]>> {
  try {
    const dcrResults = await dcrService.getDCRByDate(date, {
      classSessionId,
    });
    const observations = dcrResults.data?.observations;
    if (!dcrResults.success)
      return {
        success: false as const,
        message: 'Laporan harian tidak ditemukan',
      };
    return { success: true as const, data: observations };
  } catch (error) {
    console.error('getDCRObservationsByDate', error);
    return {
      success: false as const,
      message: 'Gagal memuat observasi anak. Coba lagi nanti.',
    };
  }
}
