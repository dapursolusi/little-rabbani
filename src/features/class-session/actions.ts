'use server';

import { db } from '@/db';
import { classSession } from '@/db/schema';
import { and, gte, isNull, lte } from 'drizzle-orm';

import { parseInput } from '@/lib/actions/parse-input';
import { requireOwner } from '@/lib/actions/require-owner';

import { ClassSessionSchema } from './schema';

export async function createClassSession(input: Record<string, unknown>) {
  return requireOwner(async () => {
    const parsed = parseInput(
      ClassSessionSchema,
      input,
      'Data batch tidak valid'
    );
    if (!parsed.success) return parsed;
    const data = parsed.data;

    try {
      const overlappingClassSession = await db.query.classSession.findFirst({
        where: and(
          isNull(classSession.deletedAt),
          lte(classSession.startTime, data.endTime),
          gte(classSession.endTime, data.startTime)
        ),
      });

      if (overlappingClassSession) {
        return {
          success: false,
          error: `Sesi ${overlappingClassSession.name} sudah berjalan di waktu yang sama. (${overlappingClassSession.startTime} - ${overlappingClassSession.endTime})`,
        };
      }

      const newClassSession = await db
        .insert(classSession)
        .values({
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
        })
        .returning();

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

export async function getClassSessions() {
  const result = await db.query.classSession.findMany({
    where: isNull(classSession.deletedAt),
    orderBy: (classSession, { desc }) => [desc(classSession.createdAt)],
  });
  return { success: true as const, data: result };
}
