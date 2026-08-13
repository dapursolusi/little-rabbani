'use server';

import { db } from '@/db';
import {
  dailyClassReport,
  dailyReportSnapshot,
  kid,
  sessionType,
  term,
} from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';

import { requireOwner } from '@/lib/actions/utils';

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

  const today = new Date().toISOString().split('T')[0];

  // Today's active session types
  let todaySessionsCount = 0;
  if (activeTerm) {
    const todaySessionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessionType)
      .where(and(eq(sessionType.active, true)));
    todaySessionsCount = Number(todaySessionsResult[0]?.count ?? 0);
  }

  // Pending DCRs: count dailyClassReport rows where date < today and no DCR
  let pendingDcrsCount = 0;
  if (activeTerm) {
    const pendingDcrsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(dailyClassReport)
      .where(and(eq(dailyClassReport.date, today)));
    // ponytail: simple pending count — count DCRs today, subtract from expected
    pendingDcrsCount = Number(pendingDcrsResult[0]?.count ?? 0);
  }

  // Pending daily reports
  let pendingReportsCount = 0;
  if (activeTerm) {
    const pendingReportsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(dailyReportSnapshot)
      .where(
        and(
          eq(dailyReportSnapshot.date, today),
          eq(dailyReportSnapshot.status, 'draft')
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
