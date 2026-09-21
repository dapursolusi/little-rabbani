import { requireOwner } from '@/lib/actions/require-owner';

import * as classSessionRepo from './repositories';
import { ClassSessionInput, OverlappingClassSessionInput } from './schema';

export async function checkOverlappingClassSession({
  startTime,
  endTime,
}: OverlappingClassSessionInput) {
  try {
    const overlappingClassSession = await classSessionRepo.findOverlapping({
      startTime,
      endTime,
    });

    if (overlappingClassSession) {
      return {
        success: false,
        error: `Sesi ${overlappingClassSession.name} sudah berjalan di waktu yang sama. (${overlappingClassSession.startTime} - ${overlappingClassSession.endTime})`,
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error('checkOverlappingClassSession', error);
    return {
      success: false,
      error: 'Gagal mengecek sesi kelas. Coba muat ulang halaman.',
    };
  }
}

export async function createClassSession(input: ClassSessionInput) {
  return requireOwner(async () => {
    try {
      const overlapCheck = await checkOverlappingClassSession({
        startTime: input.startTime,
        endTime: input.endTime,
      });

      if (!overlapCheck.success) {
        return overlapCheck;
      }

      const newClassSession = await classSessionRepo.insert(input);
      return {
        success: true,
        data: newClassSession,
      };
    } catch (error) {
      console.error('createClassSession', error);
      return {
        success: false,
        error: 'Gagal menambahkan sesi kelas baru',
      };
    }
  });
}

export async function updateClassSession(id: string, input: ClassSessionInput) {
  return requireOwner(async () => {
    try {
      const overlapCheck = await checkOverlappingClassSession({
        startTime: input.startTime,
        endTime: input.endTime,
      });

      if (!overlapCheck?.success) {
        return overlapCheck;
      }

      const updatedClassSession = await classSessionRepo.update(id, input);

      return {
        success: true as const,
        data: updatedClassSession,
      };
    } catch (error) {
      console.error('updateClassSession', error);
      return { success: false as const, error: 'Gagal memperbarui sesi kelas' };
    }
  });
}

export async function getClassSessions() {
  return requireOwner(async () => {
    try {
      const classSessions = await classSessionRepo.findMany();
      return { success: true as const, data: classSessions };
    } catch (error) {
      console.error('getClassSessions', error);
      return { success: false as const, error: 'Gagal memuat sesi kelas' };
    }
  });
}

export async function deleteClassSession(id: string) {
  return requireOwner(async () => {
    try {
      const totalClassSessions = await classSessionRepo.count();
      if (totalClassSessions === 1) {
        return {
          success: false as const,
          error:
            'Sesi kelas ini tidak dapat dihapus karena tidak ada sesi lainnya. Buat sesi kelas baru terlebih dahulu sebelum menghapus sesi ini.',
        };
      }

      const deleted = await classSessionRepo.remove(id);

      return { success: true as const, data: deleted.name };
    } catch {
      return { success: false as const, error: 'Gagal menghapus sesi' };
    }
  });
}
