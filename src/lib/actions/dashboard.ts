'use server';

import { and, eq, sql } from 'drizzle-orm';

import { requireOwner } from '@/lib/actions/utils';
import { db } from '@/lib/db';
import {
  dailyClassReport,
  dailyReportSnapshot,
  kid,
  sessionType,
  term,
  termSession,
} from '@/lib/db/schema';

export interface DashboardStats {
  activeTerm: { id: string; name: string } | null;
  enrolledKidsCount: number;
  todaySessionsCount: number;
  pendingDcrsCount: number;
  pendingReportsCount: number;
}

export async function getOwnerDashboardStats(): Promise<DashboardStats> {
  const auth = await requireOwner();
  if (!auth.authorized) {
    return {
      activeTerm: null,
      enrolledKidsCount: 0,
      todaySessionsCount: 0,
      pendingDcrsCount: 0,
      pendingReportsCount: 0,
    };
  }

  // Active term
  const activeTerm = await db.query.term.findFirst({
    where: eq(term.isActive, true),
  });

  // Enrolled kids count (across all terms)
  const enrolledKidsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(kid)
    .where(eq(kid.status, 'enrolled'));

  const enrolledKidsCount = Number(enrolledKidsResult[0]?.count ?? 0);

  // Today's sessions (only if active term exists)
  const today = new Date().toISOString().split('T')[0];
  let todaySessionsCount = 0;

  if (activeTerm) {
    const todaySessionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(termSession)
      .where(
        and(
          eq(termSession.termId, activeTerm.id),
          eq(termSession.date, today),
          eq(termSession.isHoliday, false)
        )
      );
    todaySessionsCount = Number(todaySessionsResult[0]?.count ?? 0);
  }

  // Pending DCRs (past sessions in active term with no DCR)
  let pendingDcrsCount = 0;
  if (activeTerm) {
    const pendingDcrsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(termSession)
      .where(
        and(
          eq(termSession.termId, activeTerm.id),
          eq(termSession.isHoliday, false),
          sql`${termSession.date} + ${termSession.endTime}::time < NOW()`,
          sql`NOT EXISTS (SELECT 1 FROM ${dailyClassReport}
            JOIN ${sessionType} ON ${sessionType.id} = ${dailyClassReport.sessionTypeId}
              AND ${sessionType.active} = true AND ${sessionType.deletedAt} IS NULL
            WHERE ${dailyClassReport.date} = ${termSession.date}
              AND ${sessionType.name} = ${termSession.label})`
        )
      );
    pendingDcrsCount = Number(pendingDcrsResult[0]?.count ?? 0);
  }

  // Pending daily reports (past sessions with DCR but no daily report snapshots for enrolled kids)
  let pendingReportsCount = 0;
  if (activeTerm) {
    const pendingReportsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(termSession)
      .where(
        and(
          eq(termSession.termId, activeTerm.id),
          eq(termSession.isHoliday, false),
          sql`${termSession.date} + ${termSession.endTime}::time < NOW()`,
          sql`EXISTS (SELECT 1 FROM ${dailyClassReport}
            JOIN ${sessionType} ON ${sessionType.id} = ${dailyClassReport.sessionTypeId}
              AND ${sessionType.active} = true AND ${sessionType.deletedAt} IS NULL
            WHERE ${dailyClassReport.date} = ${termSession.date}
              AND ${sessionType.name} = ${termSession.label})`,
          sql`NOT EXISTS (SELECT 1 FROM ${dailyReportSnapshot} WHERE ${dailyReportSnapshot.sessionId} = ${termSession.id})`
        )
      );
    pendingReportsCount = Number(pendingReportsResult[0]?.count ?? 0);
  }

  return {
    activeTerm: activeTerm
      ? { id: activeTerm.id, name: activeTerm.name }
      : null,
    enrolledKidsCount,
    todaySessionsCount,
    pendingDcrsCount,
    pendingReportsCount,
  };
}
