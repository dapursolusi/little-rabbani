// Find
import { db } from '@/db';
import {
  dailyClassReport,
  dcrObservation,
  kid,
  monthlyKidReport,
} from '@/db/schema';
import { startOfNextMonthDate } from '@/utils/date';
import { and, eq, gte, inArray, isNull, lt } from 'drizzle-orm';

export async function findMonthlyReport({
  kidId,
  termId,
  month: yearMonth,
  dcrIds,
}: {
  kidId: string;
  termId: string;
  month: string;
  dcrIds: string[];
}) {
  return db.query.kid.findFirst({
    where: eq(kid.id, kidId),
    columns: { id: true, nickName: true, name: true },
    with: {
      enrollments: {
        columns: { termId: true },
      },
      dcrObservations: {
        columns: {
          id: true,
          dcrId: true,
          attendance: true,
          mood: true,
          appetite: true,
          notes: true,
        },
        with: { dcr: { columns: { date: true } } },
        where: inArray(dcrObservation.dcrId, dcrIds),
      },
      monthlyReports: {
        where: and(
          eq(monthlyKidReport.termId, termId),
          eq(monthlyKidReport.month, yearMonth)
        ),
        columns: { id: true, narrative: true, reportStatus: true },
      },
    },
  });
}

// Create

// Update

// Remove
