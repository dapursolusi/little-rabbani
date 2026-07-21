import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dcrActions from '@/lib/actions/dcr';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => {
  const createChain = (resolveValue: unknown[] = []) => {
    const chain = {
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn().mockResolvedValue(resolveValue),
      returning: vi.fn().mockResolvedValue(resolveValue),
      set: vi.fn(() => chain),
      values: vi.fn(() => chain),
      limit: vi.fn(() => chain),
    };
    return chain;
  };

  return {
    db: {
      select: vi.fn(() => createChain()),
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
        termSession: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        sessionType: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        scheduleItem: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        activity: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        dailyClassReport: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        dcrActivity: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        kid: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
    },
  };
});

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const mockGetSession = auth.api.getSession as unknown as ReturnType<
  typeof vi.fn
>;

function mockOwnerSession() {
  mockGetSession.mockResolvedValue({
    user: {
      id: 'owner-1',
      role: 'owner',
      email: 'owner@littlerabbani.com',
      name: 'Owner',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: 'session-1',
      userId: 'owner-1',
      token: 'token-1',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  });
}

function mockTeacherSession() {
  mockGetSession.mockResolvedValue({
    user: {
      id: 'teacher-1',
      role: 'teacher',
      email: 'teacher@littlerabbani.com',
      name: 'Teacher',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: 'session-t1',
      userId: 'teacher-1',
      token: 'token-t1',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
    },
  });
}

/**
 * Helper: mock the session-key resolution path so that
 * resolveSessionKey('session-1') returns { date: '2026-07-08', sessionTypeId: 'st-1' }.
 */
const mockTermSessionFindFirst = db.query.termSession.findFirst as ReturnType<
  typeof vi.fn
>;
const mockSessionTypeFindMany = db.query.sessionType.findMany as ReturnType<
  typeof vi.fn
>;
const mockDcrFindFirst = db.query.dailyClassReport.findFirst as ReturnType<
  typeof vi.fn
>;
const mockDcrFindMany = db.query.dailyClassReport.findMany as ReturnType<
  typeof vi.fn
>;
const mockDcrActivityFindMany = db.query.dcrActivity.findMany as ReturnType<
  typeof vi.fn
>;
const mockTermSessionFindMany = db.query.termSession.findMany as ReturnType<
  typeof vi.fn
>;
const mockScheduleItemFindMany = db.query.scheduleItem.findMany as ReturnType<
  typeof vi.fn
>;
const mockInsert = db.insert as ReturnType<typeof vi.fn>;
const mockUpdate = db.update as ReturnType<typeof vi.fn>;
const mockDelete = db.delete as ReturnType<typeof vi.fn>;

function mockSessionResolution(
  sessionId = 'session-1',
  date = '2026-07-08',
  label = 'Kelas Pagi'
) {
  mockTermSessionFindFirst.mockResolvedValue({
    id: sessionId,
    termId: 'term-1',
    date,
    startTime: '08:00',
    endTime: '10:00',
    label,
    isHoliday: false,
    holidayReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  mockSessionTypeFindMany.mockResolvedValue([
    {
      id: 'st-1',
      name: 'Kelas Pagi',
      start: '08:00',
      end: '10:00',
      active: true,
      createdAt: new Date(2025, 0, 1),
      updatedAt: new Date(2025, 0, 1),
      deletedAt: null,
    },
  ]);
}

describe('DCR Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────── getDcrBySession ───────────────

  describe('getDcrBySession', () => {
    it('should return existing DCR with activities for a session', async () => {
      mockOwnerSession();
      mockSessionResolution();

      const mockDcr = {
        id: 'dcr-1',
        sessionId: 'session-1',
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
            activityId: 'activity-1',
            activityNameOther: null,
            deviation: 'done',
            wasPlanned: true,
            createdAt: new Date(),
            activity: {
              id: 'activity-1',
              name: 'Mewarnai',
              category: 'seni',
              isDeleted: false,
              deletedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        session: {
          id: 'session-1',
          termId: 'term-1',
          date: '2026-07-08',
          startTime: '08:00',
          endTime: '10:00',
          label: 'Kelas Pagi',
          isHoliday: false,
          holidayReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockDcrFindFirst.mockResolvedValue(
        mockDcr as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );

      const result = await dcrActions.getDcrBySession('session-1');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.id).toBe('dcr-1');
        expect(result.data.dcrActivities).toHaveLength(1);
      }
    });

    it('should return null when no DCR exists for the session', async () => {
      mockOwnerSession();
      mockSessionResolution();

      mockDcrFindFirst.mockResolvedValue(undefined);

      const result = await dcrActions.getDcrBySession('session-new');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should reject non-owner access (VAL-CAPTURE-043, VAL-CAPTURE-046)', async () => {
      mockTeacherSession();

      const result = await dcrActions.getDcrBySession('session-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Owner');
    });
  });

  // ─────────────── getScheduleActivitiesForDcr ───────────────

  describe('getScheduleActivitiesForDcr', () => {
    it('should return schedule activities for a session', async () => {
      mockOwnerSession();

      // Mock the resolution path: termSession -> sessionType -> scheduleItem by (date, sessionTypeId)
      mockTermSessionFindFirst.mockResolvedValue({
        id: 'session-1',
        termId: 'term-1',
        date: '2099-12-30',
        startTime: '08:00',
        endTime: '10:00',
        label: 'Sesi Pagi',
        isHoliday: false,
        holidayReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      mockSessionTypeFindMany.mockResolvedValue([
        {
          id: 'st-1',
          name: 'Sesi Pagi',
          start: '08:00',
          end: '10:00',
          active: true,
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: null,
        },
      ]);

      mockScheduleItemFindMany.mockResolvedValue([
        {
          id: 'si-1',
          sessionId: 'session-1',
          date: '2099-12-30',
          sessionTypeId: 'st-1',
          activityId: 'activity-1',
          type: 'activity',
          outingLocation: null,
          outingBringItems: null,
          outingPermissionRequired: false,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          activity: {
            id: 'activity-1',
            name: 'Mewarnai',
            category: 'seni',
            isDeleted: false,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 'si-2',
          sessionId: 'session-1',
          date: '2099-12-30',
          sessionTypeId: 'st-1',
          activityId: null,
          type: 'outing',
          outingLocation: 'Kebun Binatang',
          outingBringItems: 'Topi, bekal',
          outingPermissionRequired: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          activity: null,
        },
      ] as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await dcrActions.getScheduleActivitiesForDcr('session-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should reject non-owner', async () => {
      mockTeacherSession();

      const result = await dcrActions.getScheduleActivitiesForDcr('session-1');
      expect(result.success).toBe(false);
    });
  });

  // ─────────────── saveDcr ───────────────

  describe('saveDcr', () => {
    // VAL-CAPTURE-010: Owner captures DCR with activities prefilled from schedule
    it('should create a DCR with planned activities', async () => {
      mockOwnerSession();
      mockSessionResolution();

      const newDcr = {
        id: 'dcr-new',
        sessionId: 'session-1',
        date: '2026-07-08',
        sessionTypeId: 'st-1',
        learningNotes: null,
        capturedBy: 'owner-1',
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockDcrFindFirst.mockResolvedValue(undefined);

      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newDcr]),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const formData = new FormData();
      formData.append('sessionId', 'session-1');
      formData.append(
        'activities',
        JSON.stringify([
          {
            activityId: 'activity-1',
            activityNameOther: null,
            deviation: 'done',
            wasPlanned: true,
          },
        ])
      );

      const result = await dcrActions.saveDcr(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('dcr-new');
      }
    });

    // VAL-CAPTURE-011: Owner marks each deviation: done/skipped/modified
    it('should save deviation values correctly', async () => {
      mockOwnerSession();
      mockSessionResolution('session-2', '2026-07-09');

      const newDcr = {
        id: 'dcr-deviations',
        sessionId: 'session-2',
        date: '2026-07-09',
        sessionTypeId: 'st-1',
        learningNotes: null,
        capturedBy: 'owner-1',
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockDcrFindFirst.mockResolvedValue(undefined);
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newDcr]),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const formData = new FormData();
      formData.append('sessionId', 'session-2');
      formData.append(
        'activities',
        JSON.stringify([
          {
            activityId: 'a1',
            activityNameOther: null,
            deviation: 'done',
            wasPlanned: true,
          },
          {
            activityId: 'a2',
            activityNameOther: null,
            deviation: 'skipped',
            wasPlanned: true,
          },
          {
            activityId: 'a3',
            activityNameOther: null,
            deviation: 'modified',
            wasPlanned: true,
          },
        ])
      );

      const result = await dcrActions.saveDcr(formData);
      expect(result.success).toBe(true);
    });

    // VAL-CAPTURE-012: Owner adds unplanned activity mid-capture
    it('should include unplanned activities in the DCR', async () => {
      mockOwnerSession();
      mockSessionResolution('session-3', '2026-07-10');

      const newDcr = {
        id: 'dcr-unplanned',
        sessionId: 'session-3',
        date: '2026-07-10',
        sessionTypeId: 'st-1',
        learningNotes: null,
        capturedBy: 'owner-1',
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockDcrFindFirst.mockResolvedValue(undefined);
      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newDcr]),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const formData = new FormData();
      formData.append('sessionId', 'session-3');
      formData.append(
        'activities',
        JSON.stringify([
          {
            activityId: null,
            activityNameOther: 'Kunjungan dokter gigi',
            deviation: 'done',
            wasPlanned: false,
          },
        ])
      );

      const result = await dcrActions.saveDcr(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unplannedActivities).toHaveLength(1);
      }
    });

    // VAL-CAPTURE-015: One DCR per (date, sessionTypeId) — upsert
    it('should update existing DCR instead of creating duplicate', async () => {
      mockOwnerSession();
      mockSessionResolution();

      const existingDcr = {
        id: 'dcr-existing',
        sessionId: 'session-1',
        date: '2026-07-08',
        sessionTypeId: 'st-1',
        learningNotes: 'Catatan sebelumnya',
        capturedBy: 'owner-1',
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockDcrFindFirst.mockResolvedValue(
        existingDcr as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([
                { ...existingDcr, learningNotes: 'Catatan diperbarui' },
              ]),
          }),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      mockDelete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const formData = new FormData();
      formData.append('sessionId', 'session-1');
      formData.append(
        'activities',
        JSON.stringify([
          {
            activityId: 'a1',
            activityNameOther: null,
            deviation: 'done',
            wasPlanned: true,
          },
        ])
      );

      const result = await dcrActions.saveDcr(formData);
      expect(result.success).toBe(true);
    });

    it('should reject non-owner', async () => {
      mockTeacherSession();

      const formData = new FormData();
      formData.append('sessionId', 'session-1');
      formData.append('activities', '[]');

      const result = await dcrActions.saveDcr(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Owner');
    });
  });

  // ─────────────── getDcrActivitiesForPass2 ───────────────

  describe('getDcrActivitiesForPass2', () => {
    it('should return all DCR activities (planned + unplanned) for Pass 2', async () => {
      mockOwnerSession();

      mockDcrActivityFindMany.mockResolvedValue([
        {
          id: 'dca-p1',
          dcrId: 'dcr-1',
          activityId: 'activity-1',
          activityNameOther: null,
          deviation: 'done',
          wasPlanned: true,
          createdAt: new Date(),
          activity: {
            id: 'activity-1',
            name: 'Mewarnai',
            category: 'seni',
            isDeleted: false,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 'dca-p2',
          dcrId: 'dcr-1',
          activityId: null,
          activityNameOther: 'Kunjungan dokter gigi',
          deviation: 'done',
          wasPlanned: false,
          createdAt: new Date(),
          activity: null,
        },
      ] as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await dcrActions.getDcrActivitiesForPass2('dcr-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should return empty array when no DCR activities exist', async () => {
      mockOwnerSession();

      mockDcrActivityFindMany.mockResolvedValue([]);

      const result = await dcrActions.getDcrActivitiesForPass2('dcr-empty');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should reject non-owner', async () => {
      mockTeacherSession();

      const result = await dcrActions.getDcrActivitiesForPass2('dcr-1');
      expect(result.success).toBe(false);
    });
  });

  // ─────────────── getSessionsForDcr ───────────────

  describe('getSessionsForDcr', () => {
    it('should return all sessions with DCR status', async () => {
      mockOwnerSession();

      mockTermSessionFindMany.mockResolvedValue([
        {
          id: 's1',
          termId: 'term-1',
          date: '2026-07-08',
          startTime: '08:00',
          endTime: '10:00',
          label: 'Kelas Pagi',
          isHoliday: false,
          holidayReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          term: {
            id: 'term-1',
            name: 'Semester 1 2026',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ] as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Mock sessionType for resolution
      mockSessionTypeFindMany.mockResolvedValue([
        {
          id: 'st-1',
          name: 'Kelas Pagi',
          start: '08:00',
          end: '10:00',
          active: true,
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: null,
        },
      ]);

      mockDcrFindMany.mockResolvedValue([
        {
          id: 'dcr-s1',
          date: '2026-07-08',
          sessionTypeId: 'st-1',
          capturedBy: 'owner-1',
          capturedAt: new Date(),
          learningNotes: null,
        },
      ] as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await dcrActions.getSessionsForDcr();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe('s1');
      }
    });

    it('should reject non-owner', async () => {
      mockTeacherSession();

      const result = await dcrActions.getSessionsForDcr();
      expect(result.success).toBe(false);
    });
  });
});
