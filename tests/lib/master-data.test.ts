import { db } from '@/db';
import * as guardianActions from '@/features/guardian/actions';
import * as kidActions from '@/features/kid/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { auth } from '@/lib/auth';

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      guardian: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      kid: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      term: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers()),
}));

// Mock auth to simulate Owner role
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Helper to create form data from an object
function toFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

describe('Guardian Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up auth session for Owner
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
  });

  describe('createGuardian', () => {
    it('should create a guardian with required fields', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'g1',
              name: 'Budi Santoso',
              phone: '08123456789',
              email: null,
              secondContactName: null,
              secondContactPhone: null,
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await guardianActions.createGuardian(
        toFormData({ name: 'Budi Santoso', phone: '08123456789' })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Budi Santoso');
      }
    });

    it('should reject empty name field', async () => {
      const result = await guardianActions.createGuardian(
        toFormData({ name: '', phone: '08123456789' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nama');
    });

    it('should reject empty phone field', async () => {
      const result = await guardianActions.createGuardian(
        toFormData({ name: 'Budi', phone: '' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('telepon');
    });

    it('should reject request from non-owner', async () => {
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
          id: 'session-1',
          userId: 'teacher-1',
          token: 'token-1',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });

      const result = await guardianActions.createGuardian(
        toFormData({ name: 'Budi', phone: '08123456789' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Owner');
    });
  });

  describe('deleteGuardian', () => {
    it('should block deletion if guardian has linked kids', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'kid-1' }]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await guardianActions.deleteGuardian('g1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Hapus atau pindahkan murid');
    });

    it('should allow deletion if guardian has no linked kids', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await guardianActions.deleteGuardian('g1');

      expect(result.success).toBe(true);
    });
  });
});

describe('Kid Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  describe('Status Transitions', () => {
    it('should allow waiting → enrolled transition with active term', async () => {
      // Mock getActiveTerm (query.term.findFirst)
      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1',
        isActive: true,
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'kid-1',
              name: 'Ani',
              status: 'enrolled',
              enrolledTermId: 'term-1',
            },
          ]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await kidActions.createKid(
        toFormData({
          name: 'Ani',
          dob: '2020-01-15',
          guardianId: 'g1',
          status: 'enrolled',
          enrolledTermId: 'term-1',
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('enrolled');
      }
    });

    it('should block enrollment without active term', async () => {
      vi.mocked(db.query.term.findFirst).mockResolvedValue(undefined);

      const result = await kidActions.createKid(
        toFormData({
          name: 'Ani',
          dob: '2020-01-15',
          guardianId: 'g1',
          status: 'enrolled',
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Aktifkan term');
    });

    it('should allow enrolled → alumni transition (update)', async () => {
      vi.mocked(db.query.kid.findFirst).mockResolvedValue({
        id: 'kid-1',
        name: 'Ani',
        status: 'enrolled',
        dob: '2020-01-15',
        guardianId: 'g1',
        enrolledTermId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'kid-1',
                name: 'Ani',
                status: 'alumni',
                enrolledTermId: null,
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await kidActions.updateKid(
        'kid-1',
        toFormData({
          name: 'Ani',
          dob: '2020-01-15',
          guardianId: 'g1',
          status: 'alumni',
          enrolledTermId: '',
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('alumni');
      }
    });

    it('should block reverse transition: enrolled → waiting', async () => {
      vi.mocked(db.query.kid.findFirst).mockResolvedValue({
        id: 'kid-1',
        name: 'Ani',
        status: 'enrolled',
        dob: '2020-01-15',
        guardianId: 'g1',
        enrolledTermId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await kidActions.updateKid(
        'kid-1',
        toFormData({
          name: 'Ani',
          dob: '2020-01-15',
          guardianId: 'g1',
          status: 'waiting',
          enrolledTermId: '',
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak bisa mundur');
    });

    it('should block reverse transition: alumni → waiting', async () => {
      vi.mocked(db.query.kid.findFirst).mockResolvedValue({
        id: 'kid-1',
        name: 'Ani',
        status: 'alumni',
        dob: '2020-01-15',
        guardianId: 'g1',
        enrolledTermId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await kidActions.updateKid(
        'kid-1',
        toFormData({
          name: 'Ani',
          dob: '2020-01-15',
          guardianId: 'g1',
          status: 'waiting',
          enrolledTermId: '',
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak bisa mundur');
    });

    it('should allow Owner override: alumni → enrolled', async () => {
      vi.mocked(db.query.kid.findFirst).mockResolvedValue({
        id: 'kid-1',
        name: 'Ani',
        status: 'alumni',
        dob: '2020-01-15',
        guardianId: 'g1',
        enrolledTermId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      vi.mocked(db.query.term.findFirst).mockResolvedValue({
        id: 'term-1',
        name: 'Semester 1',
        isActive: true,
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'kid-1',
                name: 'Ani',
                status: 'enrolled',
                enrolledTermId: 'term-1',
              },
            ]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await kidActions.updateKid(
        'kid-1',
        toFormData({
          name: 'Ani',
          dob: '2020-01-15',
          guardianId: 'g1',
          status: 'enrolled',
          enrolledTermId: 'term-1',
        })
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('enrolled');
      }
    });

    it('should validate required fields on create', async () => {
      const result = await kidActions.createKid(
        toFormData({ name: '', dob: '', guardianId: '' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nama');
    });
  });
});
