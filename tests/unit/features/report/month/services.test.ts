import { aggregateMonthlyKidReportData } from '@/features/report/month/services';
import {
  KID_APPETITE,
  KID_ATTENDANCE,
  KID_MOOD,
} from '@/features/daily-class-report/constants';
import {
  NoDcrsError,
  NoKidFoundError,
  NoKidObservationsError,
} from '@/lib/errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Collaborator boundaries only — everything below this layer is outside the
// unit under test. Pure logic (observationAggregator) stays real.
const mocks = vi.hoisted(() => ({
  getKidBasicInfo: vi.fn(),
  getDcrsWithObservationsByKidAndMonth: vi.fn(),
}));

// NOTE: month/services.ts imports `* as kidService` (namespace import) but
// `{ dcrService }` (named import) — mock shapes must mirror that exactly.
vi.mock('@/features/kid/services', () => ({
  getKidBasicInfo: mocks.getKidBasicInfo,
}));
vi.mock('@/features/daily-class-report/services', () => ({
  dcrService: {
    getDcrsWithObservationsByKidAndMonth:
      mocks.getDcrsWithObservationsByKidAndMonth,
  },
}));

const KID = {
  id: 'KID1',
  name: 'Kid One',
  nickName: 'kOne',
};

const OBSERVATION = {
  attendance: KID_ATTENDANCE.PRESENT,
  mood: KID_MOOD.HAPPY,
  appetite: KID_APPETITE.GOOD,
};

const DCR = {
  date: '2026-10-14',
  subTheme: { theme: { name: 'Colors' }, name: 'Primary Colors' },
  description: 'Painted with red and blue',
  observations: [{ ...OBSERVATION }],
};

beforeEach(() => {
  mocks.getKidBasicInfo.mockResolvedValue(KID);
  mocks.getDcrsWithObservationsByKidAndMonth.mockResolvedValue([{ ...DCR }]);
});

afterEach(() => vi.clearAllMocks());

describe('aggregateMonthlyKidReportData', () => {
  const input = {
    kidId: 'KID1',
    termId: 'TERM1',
    yearMonth: '2026-10',
  };

  it('throws NoKidFoundError when the kid does not exist', async () => {
    mocks.getKidBasicInfo.mockResolvedValue(undefined);

    await expect(aggregateMonthlyKidReportData(input)).rejects.toThrow(
      NoKidFoundError
    );
    expect(mocks.getDcrsWithObservationsByKidAndMonth).not.toHaveBeenCalled();
  });

  it('throws NoDcrsError when the kid has no DCRs that month', async () => {
    mocks.getDcrsWithObservationsByKidAndMonth.mockResolvedValue([]);

    await expect(aggregateMonthlyKidReportData(input)).rejects.toThrow(
      NoDcrsError
    );
  });

  it('throws NoKidObservationsError when DCRs exist but carry no observations', async () => {
    mocks.getDcrsWithObservationsByKidAndMonth.mockResolvedValue([
      { ...DCR, observations: [] },
    ]);

    await expect(aggregateMonthlyKidReportData(input)).rejects.toThrow(
      NoKidObservationsError
    );
  });

  it('builds the full report shape from DCR observations', async () => {
    mocks.getDcrsWithObservationsByKidAndMonth.mockResolvedValue([
      DCR,
      {
        date: '2026-10-20',
        subTheme: null,
        description: 'Free play',
        observations: [
          {
            attendance: KID_ATTENDANCE.ABSENT,
            mood: KID_MOOD.SAD,
            appetite: KID_APPETITE.FAIR,
          },
        ],
      },
    ]);

    const result = await aggregateMonthlyKidReportData(input);

    expect(result.child).toEqual({ name: 'Kid One', nickName: 'kOne' });
    // period.end = last day of the queried month
    expect(result.period).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(result.attendance).toEqual({
      totalSchoolDay: 20,
      present: 1,
      absent: 1,
      excused: 0,
      sick: 0,
    });
    expect(result.wellbeing).toEqual({
      mood: { happy: 1, angry: 0, sad: 1, fear: 0, bored: 0, shy: 0 },
      appetite: { good: 1, fair: 1, small: 0, none: 0 },
    });
    // classActivities entries keyed by day-of-month
    expect(result.classActivities).toEqual([
      {
        14: {
          theme: 'Colors',
          subTheme: 'Primary Colors',
          description: 'Painted with red and blue',
        },
      },
      { 20: { theme: undefined, subTheme: undefined, description: 'Free play' } },
    ]);
  });

  it('counts only known enum values — null/unknown observation fields do not inflate counts', async () => {
    mocks.getDcrsWithObservationsByKidAndMonth.mockResolvedValue([
      {
        date: '2026-10-05',
        subTheme: null,
        description: null,
        observations: [
          {
            attendance: null,
            mood: undefined,
            // @ts-expect-error — simulating corrupt DB row outside enum
            appetite: 'weird-value',
          },
        ],
      },
    ]);

    const result = await aggregateMonthlyKidReportData(input);

    expect(result.attendance).toEqual({
      totalSchoolDay: 20,
      present: 0,
      absent: 0,
      excused: 0,
      sick: 0,
    });
  });
});
