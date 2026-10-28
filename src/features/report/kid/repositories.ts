// Find
import { db } from '@/db';
import { kid, monthlyKidReport } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function findMonthlyReport({
  kidId,
  termId,
  month,
}: {
  kidId: string;
  termId: string;
  month: string;
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
          attendance: true,
          mood: true,
          appetite: true,
          notes: true,
        },
        with: { dcr: { columns: { date: true } } },
      },
      monthlyReports: {
        where: and(
          eq(monthlyKidReport.termId, termId),
          eq(monthlyKidReport.month, month)
        ),
        columns: { id: true, narrative: true, reportStatus: true },
      },
    },
  });
}

// Create

// Update

// Remove
