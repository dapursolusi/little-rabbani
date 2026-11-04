// Find
import { db } from '@/db';
import { dcrObservation, kid, monthlyKidReport } from '@/db/schema';
import { omitAuditColumns } from '@/db/selections/audit-columns';
import { leanKidColumnSelection } from '@/features/kid/repositories/kid';
import { and, eq, inArray } from 'drizzle-orm';

import { MonthlyKidReportParams } from '../types';

export async function findMonthlyReport({
  kidId,
  termId,
  yearMonth,
  dcrIds,
}: MonthlyKidReportParams & {
  dcrIds: string[];
}) {
  return db.query.kid.findFirst({
    where: eq(kid.id, kidId),
    columns: leanKidColumnSelection,
    with: {
      enrollments: {
        columns: { termId: true },
      },
      dcrObservations: {
        columns: omitAuditColumns,
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
