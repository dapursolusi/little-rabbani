import { db } from '@/db';
import { dailyClassReport, dcrObservation } from '@/db/schema/daily';
import { subTheme } from '@/db/schema/theme';
import { omitAuditColumns } from '@/db/selections/audit-columns';
import { leanKidColumnSelection } from '@/features/kid/repositories/kid';
import {
  and,
  asc,
  count as drizzleCount,
  eq,
  gte,
  isNull,
  lt,
  lte,
} from 'drizzle-orm';

import { DailyClassReportInput } from '../validation';

export async function findManyByMonth({
  classSessionId,
  startDate,
  endDate,
}: {
  classSessionId: string;
  startDate: string;
  endDate: string;
}) {
  const reports = await db.query.dailyClassReport.findMany({
    where: and(
      eq(dailyClassReport.classSessionId, classSessionId),
      gte(dailyClassReport.date, startDate),
      lte(dailyClassReport.date, endDate),
      isNull(dailyClassReport.deletedAt)
    ),
    columns: { id: true, date: true },
  });
  return reports;
}

/**
 * Per-kid observation counts for one class in one window — the class-level
 * overview's readiness input. Two aggregate queries (reports, then grouped
 * observations) instead of one query per child; the counts are what the
 * existing generation eligibility checks (DCRs exist + observations exist).
 */
export async function findObservationCountsByKid({
  classSessionId,
  startDate,
  endDate,
}: {
  classSessionId: string;
  startDate: string;
  endDate: string;
}) {
  const [dcrCountRows, rows] = await Promise.all([
    db
      .select({ count: drizzleCount() })
      .from(dailyClassReport)
      .where(
        and(
          eq(dailyClassReport.classSessionId, classSessionId),
          gte(dailyClassReport.date, startDate),
          lte(dailyClassReport.date, endDate),
          isNull(dailyClassReport.deletedAt)
        )
      ),
    db
      .select({
        kidId: dcrObservation.kidId,
        count: drizzleCount(),
      })
      .from(dcrObservation)
      .innerJoin(
        dailyClassReport,
        eq(dcrObservation.dcrId, dailyClassReport.id)
      )
      .where(
        and(
          eq(dailyClassReport.classSessionId, classSessionId),
          gte(dailyClassReport.date, startDate),
          lte(dailyClassReport.date, endDate),
          isNull(dailyClassReport.deletedAt),
          isNull(dcrObservation.deletedAt)
        )
      )
      .groupBy(dcrObservation.kidId),
  ]);

  return {
    dcrCount: Number(dcrCountRows[0]?.count ?? 0),
    observationCountByKidId: Object.fromEntries(
      rows.map((row) => [row.kidId, Number(row.count)])
    ) as Record<string, number>,
  };
}

export async function findManyWithObservationsByKidAndMonth({
  classSessionId,
  kidId,
  startDate,
  endDate,
}: {
  classSessionId: string;
  kidId: string;
  startDate: string;
  endDate: string;
}) {
  return db.query.dailyClassReport.findMany({
    where: and(
      eq(dailyClassReport.classSessionId, classSessionId),
      gte(dailyClassReport.date, startDate),
      lte(dailyClassReport.date, endDate),
      isNull(dailyClassReport.deletedAt)
    ),
    columns: omitAuditColumns,
    with: {
      observations: {
        where: eq(dcrObservation.kidId, kidId),
        columns: omitAuditColumns,
        with: {
          kid: { columns: leanKidColumnSelection },
        },
      },
      subTheme: {
        columns: { name: true },
        with: {
          theme: { columns: { name: true } },
        },
      },
    },
    orderBy: asc(dailyClassReport.date),
  });
}

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
  if (filters.length === 0) return undefined;

  return db.query.dailyClassReport.findFirst({
    where: and(...filters),
    columns: omitAuditColumns,
    with: {
      observations: {
        with: {
          kid: { columns: leanKidColumnSelection },
        },
      },
    },
  });
}

export async function findById(id: string) {
  return await db.query.dailyClassReport.findFirst({
    where: eq(dailyClassReport.id, id),
    columns: {
      id: true,
      date: true,
    },
  });
}

export async function findByIdWithObservations(id: string) {
  return await db.query.dailyClassReport.findFirst({
    where: eq(dailyClassReport.id, id),
    columns: omitAuditColumns,
    with: {
      observations: {
        with: {
          kid: { columns: { id: true, name: true, nickName: true } },
        },
      },
    },
  });
}

export async function findByIdWithReportData(id: string) {
  return await db.query.dailyClassReport.findFirst({
    where: eq(dailyClassReport.id, id),
    columns: {
      description: true,
    },
    with: {
      subTheme: {
        columns: { name: true },
      },
    },
  });
}

export async function findByIdWithReports(id: string) {
  return await db.query.dailyClassReport.findFirst({
    where: eq(dailyClassReport.id, id),
    with: {
      observations: {
        with: {
          kid: { columns: { id: true, name: true, nickName: true } },
          kidReport: true,
        },
      },
    },
  });
}

export async function findSubThemeNameById(id: string): Promise<string | null> {
  const st = await db.query.subTheme.findFirst({
    where: eq(subTheme.id, id),
    columns: { name: true },
  });
  return st?.name ?? null;
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
    columns: omitAuditColumns,
    with: {
      subTheme: {
        columns: { name: true },
        with: {
          theme: { columns: { name: true } },
        },
      },
      observations: {
        columns: omitAuditColumns,
        with: {
          kid: { columns: leanKidColumnSelection },
          kidReport: {
            columns: omitAuditColumns,
          },
        },
      },
    },
  });
}
