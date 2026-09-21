import { db } from '@/db';

import { requireOwner } from '@/lib/actions/require-owner';

import { LeanKid } from '../kid/types';
import * as kidEnrollmentRepo from './repositories';
import { KidEnrollmentInput, SaveEnrollmentChangesInput } from './schema';

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

export async function getAvailableKids({
  termId,
  classSessionId,
}: {
  termId: string;
  classSessionId: string;
}) {
  try {
    // 'all' means no session filter — only filter by term
    const effectiveClassSessionId =
      classSessionId && classSessionId !== 'all' ? classSessionId : '';
    const availableKids = await kidEnrollmentRepo.findAvailableKids({
      termId,
      classSessionId: effectiveClassSessionId,
    });
    if (availableKids.length === 0) {
      return {
        success: false as const,
        error:
          'Tidak ada data anak yang bisa ditambahkan lagi. Silahkan pilih untuk batch atau sesi lainnya.',
      };
    }
    return {
      success: true as const,
      data: availableKids.map((kid) => ({
        id: kid.id,
        name: kid.name,
      })) as LeanKid[],
    };
  } catch (error) {
    console.error('getAvailableKids: ', error);
    return {
      success: false as const,
      error: 'Gagal memuat data. Coba muat ulang halaman.',
    };
  }
}

export async function createKidsEnrollments(input: KidEnrollmentInput) {
  return requireOwner(async () => {
    try {
      const enrolledKids = input.kids.map(({ kidId, status }) => {
        return {
          termId: input.termId,
          classSessionId: input.classSessionId,
          kidId,
          status,
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

export async function saveEnrollmentChanges(input: SaveEnrollmentChangesInput) {
  return requireOwner(async () => {
    try {
      const result = await db.transaction(async (tx) => {
        // 1. Insert new enrollments
        let insertedCount = 0;
        if (input.created.length > 0) {
          const newRows = input.created.map(({ kidId, status }) => ({
            termId: input.termId,
            classSessionId: input.classSessionId,
            kidId,
            status,
          }));
          await kidEnrollmentRepo.insertMany(newRows, tx);
          insertedCount = newRows.length;
        }

        // 2. Soft-delete removed enrollments
        let deletedCount = 0;
        if (input.deleted.length > 0) {
          await kidEnrollmentRepo.softDeleteMany(input.deleted, tx);
          deletedCount = input.deleted.length;
        }

        // 3. Update status changes
        let updatedCount = 0;
        if (input.updated.length > 0) {
          await Promise.all(
            input.updated.map(({ id, status }) =>
              kidEnrollmentRepo.updateStatus(id, status, tx)
            )
          );
          updatedCount = input.updated.length;
        }

        return { insertedCount, deletedCount, updatedCount };
      });

      return { success: true as const, data: result };
    } catch (error) {
      console.error('saveEnrollmentChanges: ', error);
      return {
        success: false as const,
        error: 'Gagal menyimpan perubahan pendaftaran. Coba lagi nanti.',
      };
    }
  });
}
