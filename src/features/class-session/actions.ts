'use server';

import { db } from '@/db';
import { classSession } from '@/db/schema';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';

import { parseInput } from '@/lib/actions/parse-input';
import { requireOwner } from '@/lib/actions/require-owner';

import { ClassSessionSchema } from './schema';

export async function checkOverlappingClassSession(
  startTime: string,
  endTime: string
) {
  const overlappingClassSession = await db.query.classSession.findFirst({
    where: and(
      isNull(classSession.deletedAt),
      lt(classSession.startTime, endTime),
      gt(classSession.endTime, startTime)
    ),
  });

  if (overlappingClassSession) {
    return {
      success: false,
      error: `Sesi ${overlappingClassSession.name} sudah berjalan di waktu yang sama. (${overlappingClassSession.startTime} - ${overlappingClassSession.endTime})`,
    };
  }

  return {
    success: true,
  };
}

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
      const overlapCheck = await checkOverlappingClassSession(
        data.startTime,
        data.endTime
      );

      if (!overlapCheck.success) {
        return overlapCheck;
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

export async function updateClassSession(
  id: string,
  input: Record<string, unknown>
) {
  return requireOwner(async () => {
    const parsed = parseInput(
      ClassSessionSchema,
      input,
      'Data batch tidak valid'
    );
    if (!parsed.success) return parsed;
    const data = parsed.data;
    try {
      const overlapCheck = await checkOverlappingClassSession(
        data.startTime,
        data.endTime
      );

      if (!overlapCheck.success) {
        return overlapCheck;
      }

      await db
        .update(classSession)
        .set({
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
        })
        .where(eq(classSession.id, id));

      return {
        success: true as const,
        data: await db.query.classSession.findFirst({
          where: eq(classSession.id, id),
        }),
      };
    } catch (error) {
      console.error('updateClassSession', error);
      return { success: false as const, error: 'Gagal memperbarui sesi kelas' };
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
