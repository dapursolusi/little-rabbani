import { db } from '@/db';
import { dailyClassReport } from '@/db/schema/daily';
import { and, eq, gte, lt } from 'drizzle-orm';

import { DailyClassReportInput } from '../validation';

export async function insert(input: DailyClassReportInput) {
  const [inserted] = await db
    .insert(dailyClassReport)
    .values(input)
    .returning();
  return inserted;
}

export async function update({
  input,
  dcrId,
}: {
  input: DailyClassReportInput;
  dcrId: string;
}) {
  const [updated] = await db
    .update(dailyClassReport)
    .set(input)
    .where(eq(dailyClassReport.id, dcrId))
    .returning();
  return updated;
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

export async function findMany({
  classSessionId,
  date,
}: {
  classSessionId?: string;
  date?: { year: number; month?: number };
}) {
  const filters = [];

  if (date?.year) {
    const { year, month } = date;

    const start = month
      ? `${year}-${String(month).padStart(2, '0')}-01`
      : `${year}-01-01`;

    let end: string;

    if (month) {
      end =
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    } else {
      end = `${year + 1}-01-01`;
    }

    filters.push(
      gte(dailyClassReport.date, start),
      lt(dailyClassReport.date, end)
    );
  }

  if (classSessionId) {
    filters.push(eq(dailyClassReport.classSessionId, classSessionId));
  }

  return await db.query.dailyClassReport.findMany({
    where: filters.length ? and(...filters) : undefined,
  });
}
