import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import {
  isTermFinalMonth,
  monthEndDate,
  monthStartDate,
} from '@/features/report/utils';
import * as termService from '@/features/term/services';
import { observationAggregator } from '@/utils/aggregate';
import z from 'zod';

import { parseInput } from '@/lib/action/parse-input';
import {
  KidNotEnrolledError,
  NoDcrsError,
  NoKidFoundError,
  NoKidObservationsError,
} from '@/lib/errors';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import { MonthlyKidReportParams } from '../types';

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

  const monthStart = monthStartDate(yearMonth);
  const monthEnd = monthEndDate(yearMonth);
  const startDate = term.startDate > monthStart ? term.startDate : monthStart;
  const endDate = term.endDate < monthEnd ? term.endDate : monthEnd;
  if (startDate > endDate) return null;

  return {
    classSessionId: enrollment.classSessionId,
    term,
    startDate,
    endDate,
    isFinalMonth: isTermFinalMonth(term, yearMonth),
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
