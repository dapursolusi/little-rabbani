import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as kidService from '@/features/kid/services';
import * as termService from '@/features/term/services';
import { observationAggregator } from '@/utils/aggregate';
import z from 'zod';

import { parseInput } from '@/lib/action/parse-input';
import {
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

  // 2. Validate batch and class session & load required data
  const classSessionId =
    await kidEnrollmentService.getKidClassSessionIdByTermId({
      termId,
      kidId,
    });
  if (!classSessionId)
    return {
      success: false as const,
      message:
        'Tidak ada data registrasi anak untuk batch saat ini. Pilih batch lain atau periksa registrasi anak',
    };
  const terms = await termService.getTerms();
  const dcrs = await dcrService.getDcrsByMonth({
    classSessionId,
    yearMonth,
  });

  return {
    success: true as const,
    data: { dcrs },
  };
}

// ============================================
// INTERNAL OPERATIONS
// ============================================

export async function aggregateMonthlyKidReportData({
  kidId,
  termId,
  yearMonth,
}: {
  kidId: string;
  termId: string;
  yearMonth: string;
}) {
  const kidBasicInfo = await kidService.getKidBasicInfo(kidId);

  if (!kidBasicInfo) {
    throw new NoKidFoundError();
  }

  const dcrsWithKidObservations =
    await dcrService.getDcrsWithObservationsByKidAndMonth({
      kidId,
      termId,
      yearMonth,
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

  const [year, month] = yearMonth.split('-').map(Number);

  const observationAggregate = observationAggregator({ observations });

  return {
    child: {
      name: kidBasicInfo?.name,
      nickName: kidBasicInfo?.nickName,
    },
    period: {
      start: `${yearMonth}-01`,
      end: new Date(year, month, 0).toISOString().split('T')[0], // last day of the month
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
