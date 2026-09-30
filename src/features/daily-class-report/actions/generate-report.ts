'use server';

import { dcrRepo } from '../repositories';
import { generateReportsForDCR } from '../services/generate-report';

export async function generateReports(dcrId: string) {
  try {
    const dcr = await dcrRepo.findByIdWithObservations(dcrId);
    if (!dcr) {
      return {
        success: false as const,
        error: 'Laporan harian tidak ditemukan.',
      };
    }

    const reports = await generateReportsForDCR(dcr);

    if (reports.length > 0) {
      await dcrRepo.updateNarratives(
        dcrId,
        reports.map((r) => ({
          kidId: r.kidId,
          narrativeGenerated: r.narrative,
        }))
      );
    }

    return { success: true as const, data: reports };
  } catch (error) {
    console.error('generateReports:', error);
    const msg =
      error instanceof Error ? error.message : 'Gagal membuat laporan.';
    return { success: false as const, error: msg };
  }
}

export async function saveNarrativeEdited(
  dcrId: string,
  kidId: string,
  narrativeEdited: string
) {
  try {
    await dcrRepo.saveNarrativeEdited(dcrId, kidId, narrativeEdited);
    return { success: true as const, data: null };
  } catch (error) {
    console.error('saveNarrativeEdited:', error);
    return { success: false as const, error: 'Gagal menyimpan narasi.' };
  }
}
