import { ActionResult } from '@/types';
import { isWithinEditWindow } from '@/utils/date';

import { logger } from '@/lib/logger';

import { dcrService } from '.';
import * as kidService from '../../kid/services';
import { dcrRepo, observationRepo } from '../repositories';
import {
  DCRObservation,
  DcrObservationItem,
  DcrObservationList,
} from '../types';
import { DCRObservationInput } from '../validation';

export async function createKidObservation({
  input,
  classSessionId,
}: {
  input: DCRObservationInput;
  classSessionId: string;
}): Promise<ActionResult<DcrObservationItem>> {
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

    return { success: true as const, data: kidObservation };
  } catch (error) {
    logger.error({ err: error }, 'createKidObservation');
    return {
      success: false as const,
      message: 'Gagal membuat observasi anak. Coba lagi nanti.',
    };
  }
}

export async function updateKidObservation(
  input: DCRObservationInput
): Promise<ActionResult<DcrObservationItem>> {
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
      data: updated,
    };
  } catch (error) {
    logger.error({ err: error }, 'updateKidObservation');
    return {
      success: false as const,
      message: 'Gagal mengupdate observasi anak. Coba lagi beberapa saat.',
    };
  }
}

export async function getDCRObservationsByDcrId(
  dcrId: string
): Promise<ActionResult<DcrObservationList>> {
  try {
    const observations = await observationRepo.findMany({ dcrId });
    return { success: true as const, data: observations as DcrObservationList };
  } catch (error) {
    logger.error({ err: error }, 'getDCRObservationsByDcrId');
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
    return { success: true as const, data: observations as DCRObservation[] };
  } catch (error) {
    logger.error({ err: error }, 'getDCRObservationsByDate');
    return {
      success: false as const,
      message: 'Gagal memuat observasi anak. Coba lagi nanti.',
    };
  }
}
