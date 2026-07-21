import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../env.mjs', () => ({
  env: {
    VAPID_PUBLIC_KEY: 'test-vapid-public-key',
    VAPID_PRIVATE_KEY: 'test-vapid-private-key',
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    BETTER_AUTH_SECRET: 'test-secret-12345',
    BETTER_AUTH_URL: 'http://localhost:3000',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    OPENROUTER_API_KEY: 'test-openrouter-key',
    OPENROUTER_MODEL: 'test-model',
    DEV_AUTH_BYPASS: '0',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_BETTER_AUTH_URL: 'http://localhost:3000',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'test-vapid-public-key',
  },
}));

const webpushSetVapidDetails = vi.fn();
const webpushSendNotification = vi.fn();

vi.mock('web-push', () => {
  return {
    default: {
      setVapidDetails: webpushSetVapidDetails,
      sendNotification: webpushSendNotification,
      WebPushError: class WebPushError extends Error {
        statusCode: number;
        constructor(message: string, statusCode: number) {
          super(message);
          this.name = 'WebPushError';
          this.statusCode = statusCode;
        }
      },
    },
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      sessionType: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      holiday: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      term: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      reminderLog: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      reminderConfig: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      kid: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({ rowCount: 0 }),
    }),
  },
}));

const {
  findPendingCaptureSessions,
  shouldFireScheduleReminder,
  processReminders,
} = await import('@/lib/reminder/processor');

describe('findPendingCaptureSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no active session types', async () => {
    const dbModule = await import('@/lib/db');
    vi.mocked(dbModule.db.query.sessionType.findMany).mockResolvedValue([]);

    const result = await findPendingCaptureSessions();
    expect(result).toEqual([]);
  });
});

describe('shouldFireScheduleReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false if not Thursday', async () => {
    const mockDate = new Date(2026, 0, 5); // Monday
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const result = await shouldFireScheduleReminder();
    expect(result).toBe(false);

    vi.useRealTimers();
  });
});

describe('processReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero counts when nothing to process', async () => {
    const result = await processReminders();
    expect(result).toEqual({
      capturePendingFired: 0,
      scheduleEntryFired: 0,
      cleanupDeleted: 0,
    });
  });
});
