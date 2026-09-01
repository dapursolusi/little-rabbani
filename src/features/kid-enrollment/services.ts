import * as kidEnrollmentRepo from './repositories';

export async function getKidsEnrollments({
  termId,
  classSessionId,
}: {
  termId?: string;
  classSessionId?: string;
}) {
  try {
    // termId is the filter basis; classSessionId is optional. 'all' (the
    // "Pilih Semua Sesi Kelas" sentinel) and '' both mean "no session filter" —
    // passing a non-uuid string to eq() makes Postgres throw.
    const effectiveClassSessionId =
      classSessionId && classSessionId !== 'all' ? classSessionId : undefined;
    const kidsEnrollments = await kidEnrollmentRepo.findMany({
      termId: termId ?? '',
      classSessionId: effectiveClassSessionId,
    });
    return {
      success: true as const,
      data: kidsEnrollments,
    };
  } catch (error) {
    console.error('getKidsEnrollments: ', error);
    return {
      success: false as const,
      error: 'Gagal memuat data. Coba muat ulang halaman.',
    };
  }
}
