import { requireOwner } from '@/lib/actions/require-owner';

import * as kidEnrollmentRepo from './repositories';
import { CreateKidEnrollmentInput } from './schema';

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

export async function createKidsEnrollments(input: CreateKidEnrollmentInput) {
  return requireOwner(async () => {
    try {
      const enrolledKids = input.kids.map((kid) => {
        return {
          termId: input.termId,
          classSessionId: input.classSessionId,
          kidId: kid.id,
          status: kid.status,
        };
      });
      const createdEnrollments =
        await kidEnrollmentRepo.insertMany(enrolledKids);
      return {
        success: true as const,
        data: createdEnrollments,
      };
    } catch (error) {
      console.error('createKidsEnrollments: ', error);
      return {
        success: false as const,
        error: 'Gagal membuat pendaftaran anak. Coba lagi nanti.',
      };
    }
  });
}
