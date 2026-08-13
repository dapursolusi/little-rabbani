/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dcrActions from '@/lib/actions/dcr';

vi.mock('@/db', () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
      query: {
        term: {
          findFirst: vi.fn(),
        },
        curriculum: {
          findMany: vi.fn(),
        },
        sessionType: {
          findMany: vi.fn(),
        },
        scheduleItem: {
          findMany: vi.fn(),
        },
        dailyClassReport: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        dcrActivity: {
          findMany: vi.fn(),
        },
        calendarEvent: {
          findMany: vi.fn(),
        },
      },
    },
  };
});

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: 'owner-1', role: 'owner' },
        session: { id: 's1' },
      }),
    },
  },
}));

vi.mock('@/lib/actions/utils', () => ({
  requireOwner: vi
    .fn()
    .mockResolvedValue({ authorized: true, userId: 'owner-1' }),
}));

const mockDcrFindFirst = db.query.dailyClassReport.findFirst as ReturnType<
  typeof vi.fn
>;
const mockDcrActivityFindMany = db.query.dcrActivity.findMany as ReturnType<
  typeof vi.fn
>;

describe('DCR Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDcrBySession', () => {
    it('should return existing DCR with activities', async () => {
      const mockDcr = {
        id: 'dcr-1',
        date: '2026-07-08',
        sessionTypeId: 'st-1',
        learningNotes: 'Hari yang menyenangkan',
        capturedBy: 'owner-1',
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        dcrActivities: [
          {
            id: 'dca-1',
            dcrId: 'dcr-1',
            activityNameOther: 'Mewarnai',
            deviation: 'done',
            wasPlanned: true,
            createdAt: new Date(),
          },
        ],
      };

      mockDcrFindFirst.mockResolvedValue(mockDcr as any);

      const result = await dcrActions.getDcrBySession('2026-07-08', 'st-1');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBe('dcr-1');
        expect(result.data.dcrActivities).toHaveLength(1);
      }
    });

    it('should return null when no DCR exists', async () => {
      mockDcrFindFirst.mockResolvedValue(undefined);

      const result = await dcrActions.getDcrBySession('2026-07-09', 'st-2');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('getCalendarEventsForDcr', () => {
    it('should return calendar events', async () => {
      const mockCalendarEventFindMany = db.query.calendarEvent
        .findMany as ReturnType<typeof vi.fn>;
      mockCalendarEventFindMany.mockResolvedValue([
        {
          id: 'ce-1',
          startDate: '2026-07-08',
          endDate: '2026-07-08',
          sessionTypeId: 'st-1',
          subThemeId: 'sub-theme-1',
          indoor: false,
          name: 'Mewarnai',
          location: null,
          itemsToBring: null,
          permissionRequired: false,
          sortOrder: 0,
          subTheme: {
            id: 'sub-theme-1',
            name: 'Mewarnai',
            theme: { id: 'theme-1', name: 'Seni', color: null },
          },
        },
      ] as any);

      const result = await dcrActions.getCalendarEventsForDcr(
        '2026-07-08',
        'st-1'
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe('getDcrActivitiesForPass2', () => {
    it('should return all DCR activities', async () => {
      mockDcrActivityFindMany.mockResolvedValue([
        {
          id: 'dca-1',
          dcrId: 'dcr-1',
          activityNameOther: 'Mewarnai',
          deviation: 'done',
          wasPlanned: true,
        },
      ] as any);

      const result = await dcrActions.getDcrActivitiesForPass2('dcr-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe('getNextCurriculumForSession', () => {
    const mockTerm = { id: 'term-1', name: 'Term 1', isActive: true };
    const mockItems = [
      {
        id: 'c1',
        termId: 'term-1',
        sortOrder: 0,
        name: 'Item 1',
        subTheme: { theme: { name: 'Theme 1' } },
      },
      {
        id: 'c2',
        termId: 'term-1',
        sortOrder: 1,
        name: 'Item 2',
        subTheme: { theme: { name: 'Theme 1' } },
      },
      {
        id: 'c3',
        termId: 'term-1',
        sortOrder: 2,
        name: 'Item 3',
        subTheme: { theme: { name: 'Theme 1' } },
      },
    ];

    it('returns first curriculum item when no DCRs captured yet', async () => {
      (db.query.term.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTerm
      );
      (
        db.query.curriculum.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockItems);
      (
        db.query.dailyClassReport.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const result = await dcrActions.getNextCurriculumForSession('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe('c1');
        expect(result.data?.name).toBe('Item 1');
      }
    });

    it('returns next unconsumed item when some are consumed', async () => {
      (db.query.term.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTerm
      );
      (
        db.query.curriculum.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockItems);
      (
        db.query.dailyClassReport.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ curriculumId: 'c1' }]);

      const result = await dcrActions.getNextCurriculumForSession('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.id).toBe('c2');
      }
    });

    it('returns null when all curriculum items are consumed', async () => {
      (db.query.term.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTerm
      );
      (
        db.query.curriculum.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockItems);
      (
        db.query.dailyClassReport.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { curriculumId: 'c1' },
        { curriculumId: 'c2' },
        { curriculumId: 'c3' },
      ]);

      const result = await dcrActions.getNextCurriculumForSession('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('returns null when no curriculum exists for the active term', async () => {
      (db.query.term.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTerm
      );
      (
        db.query.curriculum.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const result = await dcrActions.getNextCurriculumForSession('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('returns null when no active term exists', async () => {
      (db.query.term.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        null
      );

      const result = await dcrActions.getNextCurriculumForSession('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });
});
