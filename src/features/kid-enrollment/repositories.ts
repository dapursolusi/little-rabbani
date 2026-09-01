import { db } from '@/db';
import { kidEnrollment } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export async function findMany({
  termId,
  classSessionId,
}: {
  termId?: string;
  classSessionId?: string;
}) {
  return await db.query.kidEnrollment.findMany({
    where: and(
      isNull(kidEnrollment.deletedAt),
      termId ? eq(kidEnrollment.termId, termId) : undefined,
      classSessionId
        ? eq(kidEnrollment.classSessionId, classSessionId)
        : undefined
    ),
    with: { kid: true, classSession: true },
  });
}
