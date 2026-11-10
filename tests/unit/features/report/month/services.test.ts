import {
  KID_APPETITE,
  KID_ATTENDANCE,
  KID_MOOD,
} from '@/features/daily-class-report/constants';
import { aggregateMonthlyKidReportData } from '@/features/report/month/services';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  KidNotEnrolledError,
  NoDcrsError,
  NoKidFoundError,
  NoKidObservationsError,
} from '@/lib/errors';

// Collaborator boundaries only — everything below this layer is outside the
// unit under test. Pure logic (observationAggregator) stays real.
const mocks = vi.hoisted(() => ({
  getKidBasicInfo: vi.fn(),
  getDcrsWithObservationsByKidAndMonth: vi.fn(),
  verifyKidEnrollment: vi.fn(),
  getTermById: vi.fn(),
}));

// NOTE: month/services.ts imports `* as kidService` and `* as termService`
// (namespace imports) but `{ dcrService }` (named import) — mock shapes must
// mirror that exactly.
vi.mock('@/features/kid/services', () => ({
  getKidBasicInfo: mocks.getKidBasicInfo,
}));
vi.mock('@/features/kid-enrollment/services', () => ({
  verifyKidEnrollment: mocks.verifyKidEnrollment,
  getKidClassSessionIdByTermId: vi.fn(),
}));
vi.mock('@/features/term/services', () => ({
  getTermById: mocks.getTermById,
}));
vi.mock('@/features/daily-class-report/services', () => ({
  dcrService: {
    getDcrsWithObservationsByKidAndMonth:
      mocks.getDcrsWithObservationsByKidAndMonth,
  },
}));

const TERM = {
  id: 'TERM1',
  name: 'Term 1',
  startDate: '2026-08-01',
  endDate: '2026-12-15',
  isAutoCreated: false,
};

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
  mocks.verifyKidEnrollment.mockResolvedValue({
    id: 'ENR1',
    classSessionId: 'SESSION1',
  });
  mocks.getTermById.mockResolvedValue(TERM);
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

  it('refuses when the kid is not enrolled in the selected term', async () => {
    mocks.verifyKidEnrollment.mockResolvedValue(null);

    await expect(aggregateMonthlyKidReportData(input)).rejects.toThrow(
      KidNotEnrolledError
    );
    expect(mocks.getDcrsWithObservationsByKidAndMonth).not.toHaveBeenCalled();
  });

  it('refuses when the term does not overlap the selected month', async () => {
    mocks.getTermById.mockResolvedValue({
      ...TERM,
      startDate: '2027-01-01',
      endDate: '2027-03-31',
    });

    await expect(aggregateMonthlyKidReportData(input)).rejects.toThrow(
      KidNotEnrolledError
    );
    expect(mocks.getDcrsWithObservationsByKidAndMonth).not.toHaveBeenCalled();
  });

  it('scopes the DCR query to the month ∩ term window', async () => {
    await aggregateMonthlyKidReportData(input);

    // Term runs Aug 1 – Dec 15; October sits fully inside, so the window is
    // the whole calendar month.
    expect(mocks.getDcrsWithObservationsByKidAndMonth).toHaveBeenCalledWith({
      kidId: 'KID1',
      termId: 'TERM1',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });
  });

  it('clips the observation window to a term that starts mid-month', async () => {
    mocks.getTermById.mockResolvedValue({
      ...TERM,
      startDate: '2026-10-16',
      endDate: '2026-12-15',
    });

    await aggregateMonthlyKidReportData(input);

    expect(mocks.getDcrsWithObservationsByKidAndMonth).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2026-10-16',
        endDate: '2026-10-31',
      })
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
    // period reflects the observed window (month ∩ term), not the bare month
    expect(result.period).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(result.attendance).toEqual({
      // One DCR per school day in the window — two were observed here.
      totalSchoolDay: 2,
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
      {
        20: { theme: undefined, subTheme: undefined, description: 'Free play' },
      },
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
            appetite: 'weird-value', // untyped vi.fn() mock accepts it
          },
        ],
      },
    ]);

    const result = await aggregateMonthlyKidReportData(input);

    expect(result.attendance).toEqual({
      totalSchoolDay: 1,
      present: 0,
      absent: 0,
      excused: 0,
      sick: 0,
    });
  });
});
