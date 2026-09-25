import { ActionResult } from '@/types';

import { dcrService } from '.';
import * as kidService from '../../kid/services';
import { observationRepo } from '../repositories';
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
    return { success: true as const, data: kidObservation };
  } catch (error) {
    console.error('createKidObservation', error);
    return {
      success: false as const,
      message: 'Gagal membuat observasi anak. Coba lagi nanti.',
    };
  }
}
