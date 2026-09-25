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

export async function findDCR({ date, classSessionId }: DailyClassReportInput) {
  return await db.query.dailyClassReport.findFirst({
    where: and(
      eq(dailyClassReport.date, date),
      eq(dailyClassReport.classSessionId, classSessionId)
    ),
  });
}
