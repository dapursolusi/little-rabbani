import { dcrRepo } from '../repositories';

export async function getOrCreateDCR({
  classSessionId,
}: {
  classSessionId: string;
}) {
  try {
    const today = new Date();
    const iso = today.toISOString().split('T')[0];

    const existing = await dcrRepo.findDCR({ date: iso, classSessionId });
    if (existing) return { success: true as const, data: existing };

    const dcr = await dcrRepo.insert({ date: iso, classSessionId });
    return { success: true as const, data: dcr };
  } catch (error) {
    console.error('checkExistingDCR', error);
    return { success: false as const, error: 'Gagal memuat laporan harian' };
  }
}
