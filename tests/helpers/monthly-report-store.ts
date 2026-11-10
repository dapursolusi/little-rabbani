import {
  MONTHLY_REPORT_STATUS,
  MonthlyReportStatus,
} from '@/features/report/constants';

/**
 * In-memory stand-in for the `monthly_kid_report` repository. Mirrors the
 * contract the SQL enforces, so services can be exercised end to end without
 * a database:
 *
 * - `(kidId, termId, month)` is unique — including soft-deleted rows (the
 *   real unique index has no partial predicate).
 * - Sent rows are immutable: every write path refuses them and returns null.
 * - `insertMonthlyReportIfMissing` never overwrites a live row; it revives a
 *   soft-deleted one.
 * - Reads exclude soft-deleted rows.
 *
 * If the SQL contract changes, update both this fake and the repo tests — a
 * fake that drifts from the constraint it models silently greens the suite.
 */
export interface MonthlyReportRow {
  id: string;
  kidId: string;
  termId: string;
  month: string;
  narrative: string | null;
  reportStatus: MonthlyReportStatus;
  isEdited: boolean;
  reviewedAt: Date | null;
  sentAt: Date | null;
  sentBy: string | null;
  deletedAt: Date | null;
}

export interface MonthlyReportParams {
  kidId: string;
  termId: string;
  yearMonth: string;
}

export function createMonthlyReportStore() {
  const rows: MonthlyReportRow[] = [];
  let nextId = 1;

  // The SQL unique index covers (kid_id, term_id, month) with no partial
  // predicate — a soft-deleted row still occupies the slot.
  const key = (kidId: string, termId: string, yearMonth: string) =>
    `${kidId}|${termId}|${yearMonth}`;

  function findRow(params: MonthlyReportParams) {
    const slot = key(params.kidId, params.termId, params.yearMonth);
    return rows.find(
      (row) =>
        row.deletedAt === null && key(row.kidId, row.termId, row.month) === slot
    );
  }

  function project(row: MonthlyReportRow) {
    return {
      id: row.id,
      narrative: row.narrative,
      reportStatus: row.reportStatus,
      isEdited: row.isEdited,
      reviewedAt: row.reviewedAt,
      sentAt: row.sentAt,
      sentBy: row.sentBy,
    };
  }

  return {
    rows,
    findMonthlyReportRow: async (params: MonthlyReportParams) => {
      const row = findRow(params);
      return row ? project(row) : undefined;
    },

    findManyByTermMonth: async ({
      termId,
      yearMonth,
      kidIds,
    }: {
      termId: string;
      yearMonth: string;
      kidIds: string[];
    }) =>
      rows
        .filter(
          (row) =>
            row.termId === termId &&
            row.month === yearMonth &&
            row.deletedAt === null &&
            kidIds.includes(row.kidId)
        )
        .map((row) => ({
          kidId: row.kidId,
          reportStatus: row.reportStatus,
          isEdited: row.isEdited,
        })),

    createMonthlyReport: async ({
      kidId,
      termId,
      yearMonth,
      narrative,
      isEdited = false,
    }: MonthlyReportParams & { narrative: string; isEdited?: boolean }) => {
      const slot = key(kidId, termId, yearMonth);
      const row = rows.find(
        (candidate) =>
          key(candidate.kidId, candidate.termId, candidate.month) === slot
      );
      if (row) {
        // `setWhere: ne(status, 'sent')` — a sent row is never touched.
        if (row.reportStatus === MONTHLY_REPORT_STATUS.SENT) return null;
      }
      const values = {
        narrative,
        reportStatus: MONTHLY_REPORT_STATUS.DRAFT as MonthlyReportStatus,
        isEdited,
        reviewedAt: null,
        sentAt: null,
        sentBy: null,
        deletedAt: null,
      };
      if (row) {
        Object.assign(row, values);
        return project(row);
      }
      const created: MonthlyReportRow = {
        id: `report-${nextId++}`,
        kidId,
        termId,
        month: yearMonth,
        ...values,
      };
      rows.push(created);
      return project(created);
    },

    insertMonthlyReportIfMissing: async ({
      kidId,
      termId,
      yearMonth,
      narrative,
    }: MonthlyReportParams & { narrative: string }) => {
      const slot = key(kidId, termId, yearMonth);
      const row = rows.find(
        (candidate) =>
          key(candidate.kidId, candidate.termId, candidate.month) === slot
      );
      if (row) {
        // `setWhere: isNotNull(deletedAt)` — revive only.
        if (row.deletedAt === null) return null;
        Object.assign(row, {
          narrative,
          reportStatus: MONTHLY_REPORT_STATUS.DRAFT as MonthlyReportStatus,
          isEdited: false,
          reviewedAt: null,
          sentAt: null,
          sentBy: null,
          deletedAt: null,
        });
        return project(row);
      }
      const created: MonthlyReportRow = {
        id: `report-${nextId++}`,
        kidId,
        termId,
        month: yearMonth,
        narrative,
        reportStatus: MONTHLY_REPORT_STATUS.DRAFT,
        isEdited: false,
        reviewedAt: null,
        sentAt: null,
        sentBy: null,
        deletedAt: null,
      };
      rows.push(created);
      return project(created);
    },

    updateMonthlyReport: async ({
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
    }) => {
      const row = rows.find((candidate) => candidate.id === reportId);
      if (!row) return null;
      // `where: ne(status, 'sent')`.
      if (row.reportStatus === MONTHLY_REPORT_STATUS.SENT) return null;
      Object.assign(row, values);
      return project(row);
    },
  };
}

export type MonthlyReportStore = ReturnType<typeof createMonthlyReportStore>;
