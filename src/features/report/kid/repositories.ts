// Find
import { db } from '@/db';
import { dcrObservation, kid, monthlyKidReport } from '@/db/schema';
import { omitAuditColumns } from '@/db/selections/audit-columns';
import { leanKidColumnSelection } from '@/features/kid/repositories/kid';
import {
  MONTHLY_REPORT_STATUS,
  MonthlyReportStatus,
} from '@/features/report/constants';
import { and, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';

import { MonthlyKidReportParams } from '../types';

const monthlyReportColumns = {
  id: true,
  narrative: true,
  reportStatus: true,
  isEdited: true,
  reviewedAt: true,
  sentAt: true,
  sentBy: true,
} as const;

// `returning()` needs column refs, not booleans — derive them from the same
// key set so the two selections cannot drift.
const monthlyReportReturning = {
  id: monthlyKidReport.id,
  narrative: monthlyKidReport.narrative,
  reportStatus: monthlyKidReport.reportStatus,
  isEdited: monthlyKidReport.isEdited,
  reviewedAt: monthlyKidReport.reviewedAt,
  sentAt: monthlyKidReport.sentAt,
  sentBy: monthlyKidReport.sentBy,
} satisfies Record<keyof typeof monthlyReportColumns, unknown>;

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
        columns: monthlyReportColumns,
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
    columns: monthlyReportColumns,
  });
}

/**
 * Reports for every kid in a class, in one query — the overview must not fan
 * out one findFirst per child. Restricted to the term + calendar month and to
 * the given (already authorization-scoped) kid ids.
 */
export async function findManyByTermMonth({
  termId,
  yearMonth,
  kidIds,
}: {
  termId: string;
  yearMonth: string;
  kidIds: string[];
}) {
  if (kidIds.length === 0) return [];

  return db.query.monthlyKidReport.findMany({
    where: and(
      eq(monthlyKidReport.termId, termId),
      eq(monthlyKidReport.month, yearMonth),
      inArray(monthlyKidReport.kidId, kidIds),
      isNull(monthlyKidReport.deletedAt)
    ),
    columns: {
      kidId: true,
      reportStatus: true,
      isEdited: true,
    },
  });
}

// Create

/**
 * Insert-only creation for batch generation. If a live row already occupies
 * the kid/term/month slot — including one written concurrently — nothing is
 * changed and null is returned. A soft-deleted row is revived (reads treat it
 * as absent, so refusing would strand the child). Never overwrites content.
 */
export async function insertMonthlyReportIfMissing({
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
      reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
      isEdited: false,
    })
    .onConflictDoUpdate({
      target: [
        monthlyKidReport.kidId,
        monthlyKidReport.termId,
        monthlyKidReport.month,
      ],
      // Revive only: a live row fails this predicate, so the write is a no-op
      // and the upsert returns nothing.
      setWhere: isNotNull(monthlyKidReport.deletedAt),
      set: {
        narrative,
        reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
        isEdited: false,
        reviewedAt: null,
        sentAt: null,
        sentBy: null,
        deletedAt: null,
      },
    })
    .returning(monthlyReportReturning);

  return report ?? null;
}

/**
 * Upsert a fresh AI draft. Refuses to touch a sent report at the DB level —
 * those rows are immutable, so regeneration cannot overwrite one even if the
 * service-layer guard is bypassed.
 */
export async function createMonthlyReport({
  kidId,
  termId,
  yearMonth,
  narrative,
  isEdited = false,
}: MonthlyKidReportParams & { narrative: string; isEdited?: boolean }) {
  const [report] = await db
    .insert(monthlyKidReport)
    .values({
      kidId,
      termId,
      month: yearMonth,
      narrative,
      reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
      isEdited,
    })
    .onConflictDoUpdate({
      target: [
        monthlyKidReport.kidId,
        monthlyKidReport.termId,
        monthlyKidReport.month,
      ],
      setWhere: ne(monthlyKidReport.reportStatus, MONTHLY_REPORT_STATUS.SENT),
      set: {
        narrative,
        reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
        // Same flag as the insert path — a concurrent create must not drop a
        // manual-edit save into an unflagged AI-draft row.
        isEdited,
        reviewedAt: null,
        sentAt: null,
        sentBy: null,
        deletedAt: null,
      },
    })
    .returning(monthlyReportReturning);

  return report ?? null;
}

// Update

export async function updateMonthlyReport({
  reportId,
  values,
}: {
  reportId: string;
  values: Partial<{
    narrative: string;
    reportStatus: MonthlyReportStatus;
    isEdited: boolean;
    reviewedAt: Date | null;
    sentAt: Date | null;
    sentBy: string | null;
  }>;
}) {
  const [report] = await db
    .update(monthlyKidReport)
    .set(values)
    // Sent rows are immutable — enforce it in the write itself, not only in
    // the caller's earlier read (which a concurrent send can invalidate).
    .where(
      and(
        eq(monthlyKidReport.id, reportId),
        ne(monthlyKidReport.reportStatus, MONTHLY_REPORT_STATUS.SENT)
      )
    )
    .returning(monthlyReportReturning);

  return report ?? null;
}
