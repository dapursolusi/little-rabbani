import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as scheduleActions from '@/lib/actions/schedule';
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

function toFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

function mockOwnerSession() {
  vi.mocked(auth.api.getSession).mockResolvedValue({
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

// A session type in the future (not locked)
const FUTURE_TYPE = {
  id: 'st-future-1',
  name: 'Future Class',
  start: '08:00',
  end: '10:00',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// A session type in the past (locked)
const PAST_TYPE = {
  id: 'st-past-1',
  name: 'Past Class',
  start: '08:00',
  end: '10:00',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const SCHEDULE_ITEM_BASE = {
  date: null,
  sessionTypeId: null,
  sessionId: 'session-future-1',
  outingLocation: null,
  outingBringItems: null,
  outingPermissionRequired: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('Schedule Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOwnerSession();
  });

  // VAL-CAPTURE-001: Owner creates schedule item with catalog activity
  describe('createScheduleItem - activity', () => {
    it('should create a schedule item with a catalog activity', async () => {
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(FUTURE_TYPE);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'si-1',
              ...SCHEDULE_ITEM_BASE,
              date: '2099-12-30',
              sessionTypeId: 'st-future-1',
              activityId: 'activity-1',
              type: 'activity',
              sortOrder: 0,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await scheduleActions.createScheduleItem(
        toFormData({
          date: '2099-12-30',
          sessionTypeId: 'st-future-1',
          sessionId: 'session-future-1',
          activityId: 'activity-1',
          type: 'activity',
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('activity');
        expect(result.data.activityId).toBe('activity-1');
        expect(result.data.date).toBe('2099-12-30');
        expect(result.data.sessionTypeId).toBe('st-future-1');
      }
    });

    it('should reject if session type not found', async () => {
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(undefined);

      const result = await scheduleActions.createScheduleItem(
        toFormData({
          date: '2099-12-30',
          sessionTypeId: 'nonexistent',
          sessionId: 'session-future-1',
          activityId: 'activity-1',
          type: 'activity',
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });

    // VAL-CROSS-025: Schedule edit window closes at session start
    it('should reject if session start time has passed (locked)', async () => {
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(PAST_TYPE);

      const result = await scheduleActions.createScheduleItem(
        toFormData({
          date: '2020-01-15',
          sessionTypeId: 'st-past-1',
          sessionId: 'session-past-1',
          activityId: 'activity-1',
          type: 'activity',
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('sudah dimulai');
    });

    it('should reject non-owner', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'teacher',
          email: 'teacher@test.com',
          name: 'Teacher',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 's1',
          userId: 'teacher-1',
          token: 't1',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });

      const result = await scheduleActions.createScheduleItem(
        toFormData({
          date: '2099-12-30',
          sessionTypeId: 'st-future-1',
          sessionId: 'session-future-1',
          activityId: 'activity-1',
          type: 'activity',
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Owner');
    });

    it('should require date and sessionTypeId', async () => {
      const result = await scheduleActions.createScheduleItem(
        toFormData({
          activityId: 'activity-1',
          type: 'activity',
        })
      );

      expect(result.success).toBe(false);
    });
  });

  // VAL-CAPTURE-002: Owner creates schedule item with outing
  describe('createScheduleItem - outing', () => {
    it('should create an outing schedule item', async () => {
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(FUTURE_TYPE);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'si-2',
              ...SCHEDULE_ITEM_BASE,
              date: '2099-12-30',
              sessionTypeId: 'st-future-1',
              activityId: null,
              type: 'outing',
              outingLocation: 'Kebun Binatang',
              outingBringItems: 'Topi, bekal',
              outingPermissionRequired: true,
              sortOrder: 0,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await scheduleActions.createScheduleItem(
        toFormData({
          date: '2099-12-30',
          sessionTypeId: 'st-future-1',
          sessionId: 'session-future-1',
          type: 'outing',
          outingLocation: 'Kebun Binatang',
          outingBringItems: 'Topi, bekal',
          outingPermissionRequired: 'true',
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('outing');
        expect(result.data.activityId).toBeNull();
        expect(result.data.outingLocation).toBe('Kebun Binatang');
        expect(result.data.outingBringItems).toBe('Topi, bekal');
        expect(result.data.outingPermissionRequired).toBe(true);
      }
    });
  });

  // VAL-CAPTURE-004 / VAL-CROSS-025: Locked after session start
  describe('session lock check', () => {
    it('should allow editing future session', async () => {
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(FUTURE_TYPE);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'si-3',
              ...SCHEDULE_ITEM_BASE,
              date: '2099-12-30',
              sessionTypeId: 'st-future-1',
              activityId: 'activity-1',
              type: 'activity',
              sortOrder: 0,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await scheduleActions.createScheduleItem(
        toFormData({
          date: '2099-12-30',
          sessionTypeId: 'st-future-1',
          sessionId: 'session-future-1',
          activityId: 'activity-1',
          type: 'activity',
        })
      );

      expect(result.success).toBe(true);
    });
  });

  // VAL-CAPTURE-007: Owner deletes schedule item
  describe('deleteScheduleItem', () => {
    it('should delete a schedule item', async () => {
      vi.mocked(db.query.scheduleItem.findFirst).mockResolvedValue({
        id: 'si-1',
        ...SCHEDULE_ITEM_BASE,
        date: '2099-12-30',
        sessionTypeId: 'st-future-1',
        activityId: 'activity-1',
        type: 'activity',
        sortOrder: 0,
      });
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(FUTURE_TYPE);

      const result = await scheduleActions.deleteScheduleItem(
        toFormData({ id: 'si-1' })
      );
      expect(result.success).toBe(true);
    });

    it('should reject if item not found', async () => {
      vi.mocked(db.query.scheduleItem.findFirst).mockResolvedValue(undefined);

      const result = await scheduleActions.deleteScheduleItem(
        toFormData({ id: 'nonexistent' })
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });

    it('should reject deletion of locked session item', async () => {
      vi.mocked(db.query.scheduleItem.findFirst).mockResolvedValue({
        id: 'si-past',
        ...SCHEDULE_ITEM_BASE,
        date: '2020-01-15',
        sessionTypeId: 'st-past-1',
        sessionId: 'session-past-1',
        activityId: 'activity-1',
        type: 'activity',
        sortOrder: 0,
      });
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(PAST_TYPE);

      const result = await scheduleActions.deleteScheduleItem(
        toFormData({ id: 'si-past' })
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('sudah dimulai');
    });

    // VAL-CAPTURE-045: Server action enforces role check
    it('should reject non-owner', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: {
          id: 'teacher-1',
          role: 'teacher',
          email: 'teacher@test.com',
          name: 'Teacher',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 's1',
          userId: 'teacher-1',
          token: 't1',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });

      const result = await scheduleActions.deleteScheduleItem(
        toFormData({ id: 'si-1' })
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Owner');
    });
  });

  // VAL-CAPTURE-005: Add activity to schedule
  describe('updateScheduleItem', () => {
    it('should update a schedule item', async () => {
      vi.mocked(db.query.scheduleItem.findFirst).mockResolvedValue({
        id: 'si-1',
        ...SCHEDULE_ITEM_BASE,
        date: '2099-12-30',
        sessionTypeId: 'st-future-1',
        activityId: 'activity-1',
        type: 'activity',
        sortOrder: 0,
      });
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(FUTURE_TYPE);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'si-1',
                ...SCHEDULE_ITEM_BASE,
                date: '2099-12-30',
                sessionTypeId: 'st-future-1',
                activityId: 'activity-2',
                type: 'activity',
                sortOrder: 0,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await scheduleActions.updateScheduleItem(
        toFormData({
          id: 'si-1',
          activityId: 'activity-2',
          type: 'activity',
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activityId).toBe('activity-2');
      }
    });
  });

  // VAL-CAPTURE-054: Schedule item with null activity_id renders as outing correctly
  describe('outing rendering (null activity_id)', () => {
    it('should create outing with null activity_id', async () => {
      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue(FUTURE_TYPE);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'si-outing',
              ...SCHEDULE_ITEM_BASE,
              date: '2099-12-30',
              sessionTypeId: 'st-future-1',
              activityId: null,
              type: 'outing',
              outingLocation: 'Taman Kota',
              outingBringItems: 'Topi, air minum',
              outingPermissionRequired: true,
              sortOrder: 0,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await scheduleActions.createScheduleItem(
        toFormData({
          date: '2099-12-30',
          sessionTypeId: 'st-future-1',
          sessionId: 'session-future-1',
          type: 'outing',
          outingLocation: 'Taman Kota',
          outingBringItems: 'Topi, air minum',
          outingPermissionRequired: 'true',
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('outing');
        expect(result.data.activityId).toBeNull();
        expect(result.data.outingLocation).toBe('Taman Kota');
        expect(result.data.outingPermissionRequired).toBe(true);
      }
    });
  });
});
