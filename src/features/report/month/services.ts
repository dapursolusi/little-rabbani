import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import { monthWindowInTerm } from '@/features/report/utils';
import * as termService from '@/features/term/services';
import { observationAggregator } from '@/utils/aggregate';
import z from 'zod';

import { parseInput } from '@/lib/action/parse-input';
import {
  AppError,
  KidNotEnrolledError,
  NoDcrsError,
  NoKidFoundError,
  NoKidObservationsError,
} from '@/lib/errors';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import * as kidReportRepo from '../kid/repositories';
import {
  ClassReportKid,
  ClassReportOverview,
  ClassReportOverviewParams,
  MonthlyKidReportParams,
} from '../types';

const classOverviewSchema = z.object({
  termId: uuidSchema,
  classSessionId: uuidSchema.or(z.literal('all')).optional(),
  yearMonth: isoYearMonthSchema,
});

// ============================================
// SERVER ACTION USE CASES
// ============================================

// ============================================
// SERVER COMPONENT QUERIES
// ============================================

// Read

export async function getMonthlyAcademicDetails(input: MonthlyKidReportParams) {
  // 1. Input validation
  const parsed = parseInput({
    input,
    schema: z.object({
      kidId: uuidSchema,
      termId: uuidSchema,
      yearMonth: isoYearMonthSchema,
    }),
  });
  if (!parsed.success) return parsed;
  const { kidId, termId, yearMonth } = parsed.data;

  // 2. Resolve the term + month intersection; observations never leak across
  //    terms that merely share a calendar month.
  const range = await resolveReportRange({ kidId, termId, yearMonth });
  if (!range) {
    return {
      success: false as const,
      message:
        'Tidak ada data registrasi anak untuk batch saat ini. Pilih batch lain atau periksa registrasi anak',
    };
  }

  const dcrs = await dcrService.getDcrsByMonth({
    classSessionId: range.classSessionId,
    startDate: range.startDate,
    endDate: range.endDate,
  });

  return {
    success: true as const,
    data: { dcrs, isFinalMonth: range.isFinalMonth },
  };
}

// ============================================
// INTERNAL OPERATIONS
// ============================================

/**
 * Resolve the effective observation window for one kid/term/month: the
 * intersection of the calendar month and the term's date range, plus the
 * enrolled class session. Returns null when the kid is not enrolled in the
 * term or the term does not overlap the month — callers must refuse to
 * generate or persist in that case.
 */
export async function resolveReportRange(input: MonthlyKidReportParams) {
  const { kidId, termId, yearMonth } = input;

  const [enrollment, term] = await Promise.all([
    kidEnrollmentService.verifyKidEnrollment({ kidId, termId }),
    termService.getTermById(termId),
  ]);
  if (!enrollment || !term) return null;

  const window = monthWindowInTerm(term, yearMonth);
  if (!window) return null;

  return {
    classSessionId: enrollment.classSessionId,
    term,
    ...window,
  };
}

/**
 * The class-level overview: every enrolled child in the term (and class), each
 * child's data readiness (the same DCR + observation requirement generation
 * enforces) next to their persisted report lifecycle. Reports and observation
 * counts are fetched in bulk — never one query per child.
 */
export async function getClassMonthlyReportOverview(
  input: ClassReportOverviewParams
): Promise<ClassReportOverview> {
  // 1. Input validation
  const parsed = parseInput({
    input,
    schema: classOverviewSchema,
    fallbackError: 'Invalid class overview params',
  });
  if (!parsed.success) throw new AppError(parsed.message, parsed.message);
  const { termId, yearMonth } = parsed.data;
  const classSessionId =
    parsed.data.classSessionId && parsed.data.classSessionId !== 'all'
      ? parsed.data.classSessionId
      : undefined;

  // 2. The month must be reportable for the term at all.
  const term = await termService.getTermById(termId);
  const window = term ? monthWindowInTerm(term, yearMonth) : null;
  if (!term || !window) {
    throw new AppError(
      'Term does not overlap the selected month',
      'Batch ini tidak mencakup bulan yang dipilih'
    );
  }

  // 3. Enrolled children — the only source of overview rows. The enrollment
  //    query is the authorization scope: children outside the selected term
  //    and class never enter the result.
  const enrollments = await kidEnrollmentService.getKidsEnrollments({
    termId,
    classSessionId,
  });
  const kidIds = enrollments.map((enrollment) => enrollment.kidId);
  if (kidIds.length === 0) {
    return {
      kids: [],
      summary: {
        totalKids: 0,
        withReport: 0,
        eligibleWithoutReport: 0,
        insufficientWithoutReport: 0,
      },
      isFinalMonth: window.isFinalMonth,
      monthStart: window.startDate,
      monthEnd: window.endDate,
    };
  }

  // 4. Bulk reads: one observation-count query per class session in scope, and
  //    one report query for the whole class/month.
  const classSessionIds = [
    ...new Set(enrollments.map((enrollment) => enrollment.classSessionId)),
  ];
  const [countsByClass, reports] = await Promise.all([
    Promise.all(
      classSessionIds.map(async (sessionId) => {
        const counts = await dcrService.getObservationCountsByKidForMonth({
          classSessionId: sessionId,
          startDate: window.startDate,
          endDate: window.endDate,
        });
        return [sessionId, counts] as const;
      })
    ),
    kidReportRepo.findManyByTermMonth({ termId, yearMonth, kidIds }),
  ]);
  const countsByClassId = new Map(countsByClass);
  const reportByKidId = new Map(
    reports.map((report) => [report.kidId, report] as const)
  );

  // 5. Derive readiness and lifecycle for each child from the same rows, so the
  //    summary and the child list cannot disagree.
  const kids: ClassReportKid[] = enrollments.map((enrollment) => {
    const counts = countsByClassId.get(enrollment.classSessionId);
    const observationCount =
      counts?.observationCountByKidId[enrollment.kidId] ?? 0;
    const ready = observationCount > 0;
    const report = reportByKidId.get(enrollment.kidId);

    return {
      kidId: enrollment.kidId,
      name: enrollment.kid.name,
      nickName: enrollment.kid.nickName,
      classSessionId: enrollment.classSessionId,
      ready,
      ...(ready
        ? {}
        : {
            readinessReason:
              (counts?.dcrCount ?? 0) === 0
                ? 'Belum ada laporan harian di bulan ini'
                : 'Belum ada observasi untuk anak ini',
          }),
      reportStatus: report?.reportStatus ?? null,
      isEdited: report?.isEdited ?? false,
    };
  });

  const summary = kids.reduce(
    (acc, kid) => {
      acc.totalKids += 1;
      if (kid.reportStatus) {
        acc.withReport += 1;
      } else if (kid.ready) {
        acc.eligibleWithoutReport += 1;
      } else {
        acc.insufficientWithoutReport += 1;
      }
      return acc;
    },
    {
      totalKids: 0,
      withReport: 0,
      eligibleWithoutReport: 0,
      insufficientWithoutReport: 0,
    }
  );

  return {
    kids,
    summary,
    isFinalMonth: window.isFinalMonth,
    monthStart: window.startDate,
    monthEnd: window.endDate,
  };
}

export async function aggregateMonthlyKidReportData({
  kidId,
  termId,
  yearMonth,
}: {
  kidId: string;
  termId: string;
  yearMonth: string;
}) {
  const range = await resolveReportRange({ kidId, termId, yearMonth });
  if (!range) {
    throw new KidNotEnrolledError();
  }

  const kidBasicInfo = await kidService.getKidBasicInfo(kidId);

  if (!kidBasicInfo) {
    throw new NoKidFoundError();
  }

  const dcrsWithKidObservations =
    await dcrService.getDcrsWithObservationsByKidAndMonth({
      kidId,
      termId,
      startDate: range.startDate,
      endDate: range.endDate,
    });

  if (dcrsWithKidObservations.length === 0) {
    throw new NoDcrsError({ month: true });
  }

  const observations = dcrsWithKidObservations
    .map((dcr) => dcr.observations)
    .flat();

  if (observations.length === 0) {
    throw new NoKidObservationsError();
  }

  const classActivities = dcrsWithKidObservations.map((dcr) => ({
    [Number(dcr.date.split('-')[2])]: {
      theme: dcr.subTheme?.theme.name,
      subTheme: dcr.subTheme?.name,
      description: dcr.description,
    },
  }));

  const observationAggregate = observationAggregator({ observations });

  return {
    child: {
      name: kidBasicInfo?.name,
      nickName: kidBasicInfo?.nickName,
    },
    period: {
      // The actual observed window: month ∩ term, not the bare calendar month.
      start: range.startDate,
      end: range.endDate,
    },
    attendance: {
      totalSchoolDay: 20,
      ...observationAggregate['attendance'],
    },
    wellbeing: {
      mood: observationAggregate['mood'],
      appetite: observationAggregate['appetite'],
    },
    classActivities,
  };
}
