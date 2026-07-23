/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as captureActions from '@/lib/actions/capture';
import { auth } from '@/lib/auth';

vi.mock('@/lib/db', () => {
  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockResolvedValue([]),
        })),
        where: vi.fn(() => ({
          orderBy: vi.fn().mockResolvedValue([]),
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
        kid: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        observation: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
        observationNote: {
          findMany: vi.fn(),
        },
        observationActivity: {
          findMany: vi.fn(),
        },
        dailyClassReport: {
          findFirst: vi.fn(),
        },
        dcrActivity: {
          findMany: vi.fn(),
        },
        term: {
          findFirst: vi.fn(),
        },
        sessionType: {
          findFirst: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
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

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

function mockTeacherSession() {
  vi.mocked(auth.api.getSession).mockResolvedValue({
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

describe('Capture Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────── savePass1Observation ───────────────

  describe('savePass1Observation', () => {
    it('should save a new observation with all fields', async () => {
      mockTeacherSession();

      const newObservation = {
        id: 'obs-new',
        kidId: 'kid-1',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        mood: 4,
        appetite: 'good',
        presence: 'present_full',
        absenceReason: null,
        version: 0,
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue({
        id: 'st-1',
        name: 'Kelas Pagi',
        start: '08:00',
        end: '10:00',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(undefined);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newObservation]),
        }),
      } as any);

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('date', '2026-07-08');
      formData.append('mood', '4');
      formData.append('appetite', 'good');
      formData.append('presence', 'present_full');
      formData.append('notes', 'Anak sangat bersemangat hari ini');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('obs-new');
      }
    });

    it('should reject mood outside 1-5 range', async () => {
      mockTeacherSession();

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('date', '2026-07-08');
      formData.append('mood', '6');
      formData.append('appetite', 'good');
      formData.append('presence', 'present_full');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid appetite value', async () => {
      mockTeacherSession();

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('date', '2026-07-08');
      formData.append('mood', '3');
      formData.append('appetite', 'invalid');
      formData.append('presence', 'present_full');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(false);
    });

    it('should require absence_reason when presence is absent', async () => {
      mockTeacherSession();

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('date', '2026-07-08');
      formData.append('mood', '3');
      formData.append('appetite', 'good');
      formData.append('presence', 'absent');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('wajib');
    });

    it('should accept late and early_pickup presence values', async () => {
      mockTeacherSession();

      const newObservation = {
        id: 'obs-2',
        kidId: 'kid-2',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        mood: 3,
        appetite: 'moderate',
        presence: 'late',
        absenceReason: null,
        version: 0,
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.sessionType.findFirst).mockResolvedValue({
        id: 'st-1',
        name: 'Kelas Pagi',
        start: '08:00',
        end: '10:00',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(undefined);

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newObservation]),
        }),
      } as any);

      const formData = new FormData();
      formData.append('kidId', 'kid-2');
      formData.append('date', '2026-07-08');
      formData.append('mood', '3');
      formData.append('appetite', 'moderate');
      formData.append('presence', 'late');

      const result = await captureActions.savePass1Observation(formData);
      expect(result.success).toBe(true);
    });
  });

  // ─────────────── savePass2Observation ───────────────

  describe('savePass2Observation', () => {
    it('should save activity participation', async () => {
      mockTeacherSession();

      const existingObs = {
        id: 'obs-1',
        kidId: 'kid-1',
        sessionId: 'session-1',
        teacherId: 'teacher-1',
        mood: 4,
        appetite: 'good',
        presence: 'present_full',
        absenceReason: null,
        version: 1,
        capturedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(
        existingObs as any
      );

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('date', '2026-07-08');
      formData.append(
        'activities',
        JSON.stringify([
          { dcrActivityId: 'dca-1', participated: 'yes' },
          { dcrActivityId: 'dca-2', participated: 'no' },
        ])
      );

      const result = await captureActions.savePass2Observation(formData);
      expect(result.success).toBe(true);
    });

    it('should require existing observation (Pass 1 done first)', async () => {
      mockTeacherSession();

      vi.mocked(db.query.observation.findFirst).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.append('kidId', 'kid-1');
      formData.append('date', '2026-07-08');
      formData.append('activities', '[]');

      const result = await captureActions.savePass2Observation(formData);
      expect(result.success).toBe(false);
    });
  });

  // ─────────────── getPass2Status ───────────────

  describe('getPass2Status', () => {
    it('should return locked when DCR not captured', async () => {
      mockTeacherSession();

      vi.mocked(db.query.dailyClassReport.findFirst).mockResolvedValue(
        undefined
      );

      const result = await captureActions.getPass2Status('2026-07-08', 'st-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDcrCaptured).toBe(false);
      }
    });

    it('should return unlocked when DCR is captured', async () => {
      mockTeacherSession();

      vi.mocked(db.query.dailyClassReport.findFirst).mockResolvedValue({
        id: 'dcr-1',
        date: '2026-07-08',
        sessionTypeId: 'st-1',
        capturedAt: new Date(),
      } as any);

      const result = await captureActions.getPass2Status('2026-07-08', 'st-1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDcrCaptured).toBe(true);
      }
    });
  });

  // ─────────────── getPass2Activities ───────────────

  describe('getPass2Activities', () => {
    it('should return DCR activities for Pass 2', async () => {
      mockTeacherSession();

      vi.mocked(db.query.dailyClassReport.findFirst).mockResolvedValue({
        id: 'dcr-1',
        date: '2026-07-08',
        sessionTypeId: 'st-1',
      } as any);

      vi.mocked(db.query.dcrActivity.findMany).mockResolvedValue([
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
      ] as any);

      const result = await captureActions.getPass2Activities(
        '2026-07-08',
        'st-1'
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('should return empty array when no activities', async () => {
      mockTeacherSession();

      // No DCR exists
      vi.mocked(db.query.dailyClassReport.findFirst).mockResolvedValue(
        undefined as any
      );

      const result = await captureActions.getPass2Activities(
        '2026-07-08',
        'st-1'
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });
});
