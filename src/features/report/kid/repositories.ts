// Find
import { db } from '@/db';
import { dcrObservation, kid, monthlyKidReport } from '@/db/schema';
import { omitAuditColumns } from '@/db/selections/audit-columns';
import { leanKidColumnSelection } from '@/features/kid/repositories/kid';
import {
  MONTHLY_REPORT_STATUS,
  MonthlyReportStatus,
} from '@/features/report/constants';
import { and, eq, inArray, isNull } from 'drizzle-orm';

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
          eq(monthlyKidReport.month, yearMonth),
          isNull(monthlyKidReport.deletedAt)
        ),
        columns: { id: true, narrative: true, reportStatus: true },
      },
    },
  });
}

export async function findMonthlyReportRow({
  kidId,
  termId,
  yearMonth,
}: MonthlyKidReportParams) {
  return db.query.monthlyKidReport.findFirst({
    where: and(
      eq(monthlyKidReport.kidId, kidId),
      eq(monthlyKidReport.termId, termId),
      eq(monthlyKidReport.month, yearMonth),
      isNull(monthlyKidReport.deletedAt)
    ),
    columns: { id: true, narrative: true, reportStatus: true },
  });
}

// Create

export async function createMonthlyReport({
  kidId,
  termId,
  yearMonth,
  narrative,
}: MonthlyKidReportParams & { narrative: string }) {
  const [report] = await db
    .insert(monthlyKidReport)
    .values({
      kidId,
      termId,
      month: yearMonth,
      narrative,
      reportStatus: MONTHLY_REPORT_STATUS.GENERATED,
    })
    .onConflictDoUpdate({
      target: [
        monthlyKidReport.kidId,
        monthlyKidReport.termId,
        monthlyKidReport.month,
      ],
      set: {
        narrative,
        reportStatus: MONTHLY_REPORT_STATUS.GENERATED,
        deletedAt: null,
      },
    })
    .returning({ id: monthlyKidReport.id });

  return report ?? null;
}

// Update

export async function updateMonthlyReportNarrative({
  reportId,
  narrative,
  reportStatus,
}: {
  reportId: string;
  narrative: string;
  reportStatus: MonthlyReportStatus;
}) {
  const [report] = await db
    .update(monthlyKidReport)
    .set({ narrative, reportStatus })
    .where(eq(monthlyKidReport.id, reportId))
    .returning({
      id: monthlyKidReport.id,
      narrative: monthlyKidReport.narrative,
      reportStatus: monthlyKidReport.reportStatus,
      updatedAt: monthlyKidReport.updatedAt,
    });

  return report ?? null;
}
