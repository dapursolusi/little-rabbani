import { db } from '@/db';
import { dailyClassReport } from '@/db/schema/daily';
import { and, eq } from 'drizzle-orm';

import { DailyClassReportInput } from '../validation';

export async function insert(input: DailyClassReportInput) {
  const [inserted] = await db
    .insert(dailyClassReport)
    .values(input)
    .returning();
  return inserted;
}

export async function findDCR({
  date,
  classSessionId,
}: {
  date?: string;
  classSessionId?: string;
}) {
  const filters = [
    date ? eq(dailyClassReport.date, date) : undefined,
    classSessionId
      ? eq(dailyClassReport.classSessionId, classSessionId)
      : undefined,
  ].filter((f) => f !== undefined);
  if (filters.length === 0) return null;

  return await db.query.dailyClassReport.findFirst({
    where: and(...filters),
    with: {
      observations: {
        with: {
          kid: { columns: { id: true, name: true, nickName: true } },
        },
      },
    },
  });
}
