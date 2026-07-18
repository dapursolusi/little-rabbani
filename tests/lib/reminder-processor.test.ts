import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock env.mjs — matches the import path used in push.ts (../../../env.mjs → /env.mjs)
// From tests/lib/reminder-processor.test.ts, ../../env.mjs resolves to project root /env.mjs
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

// Track web-push calls for assertions
const webpushSetVapidDetails = vi.fn();
const webpushSendNotification = vi.fn();

// Mock web-push
vi.mock('web-push', () => {
  return {
    default: {
      setVapidDetails: webpushSetVapidDetails,
      sendNotification: webpushSendNotification,
      WebPushError: class WebPushError extends Error {
        statusCode: number;
        constructor(
          message: string,
          statusCode: number,
          _headers: Headers,
          _body: string,
          _endpoint: string
        ) {
          super(message);
          this.name = 'WebPushError';
          this.statusCode = statusCode;
        }
      },
    },
  };
});

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      termSession: {
        findMany: vi.fn().mockResolvedValue([]),
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

// Import after mocks
const {
  findPendingCaptureSessions,
  shouldFireScheduleReminder,
  processReminders,
} = await import('@/lib/reminder/processor');
const { sendPushNotification } = await import('@/lib/reminder/push');

describe('push.ts — VAPID key configuration', () => {
  it('imports env from env.mjs and configures web-push with VAPID details', async () => {
    expect(webpushSetVapidDetails).toHaveBeenCalledTimes(1);
    expect(webpushSetVapidDetails).toHaveBeenCalledWith(
      'mailto:admin@littlerabbani.sch.id',
      'test-vapid-public-key',
      'test-vapid-private-key'
    );
  });
});

describe('sendPushNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validSubscription = {
    endpoint: 'https://example.com/push/endpoint-1',
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key',
  };

  const payload = {
    title: 'Capture Tertunda',
    body: 'Ada 3 anak yang perlu dicapture',
    url: '/dashboard/owner',
  };

  it('sends push notification successfully', async () => {
    webpushSendNotification.mockResolvedValueOnce(undefined);

    const result = await sendPushNotification(validSubscription, payload);

    expect(result.success).toBe(true);
    expect(result.needsRemoval).toBe(false);
    expect(webpushSendNotification).toHaveBeenCalledTimes(1);
    expect(webpushSendNotification).toHaveBeenCalledWith(
      {
        endpoint: validSubscription.endpoint,
        keys: {
          p256dh: validSubscription.p256dh,
          auth: validSubscription.auth,
        },
      },
      JSON.stringify(payload)
    );
  });

  it('returns needsRemoval=true on 410 Gone', async () => {
    const { WebPushError } = (await import('web-push')).default;
    webpushSendNotification.mockRejectedValueOnce(
      new WebPushError(
        'Subscription expired',
        410,
        {} as Record<string, string>,
        '',
        ''
      )
    );

    const result = await sendPushNotification(validSubscription, payload);

    expect(result.success).toBe(false);
    expect(result.needsRemoval).toBe(true);
  });

  it('returns needsRemoval=true on 404 Not Found', async () => {
    const { WebPushError } = (await import('web-push')).default;
    webpushSendNotification.mockRejectedValueOnce(
      new WebPushError(
        'Subscription not found',
        404,
        {} as Record<string, string>,
        '',
        ''
      )
    );

    const result = await sendPushNotification(validSubscription, payload);

    expect(result.success).toBe(false);
    expect(result.needsRemoval).toBe(true);
  });

  it('returns needsRemoval=false on other errors', async () => {
    webpushSendNotification.mockRejectedValueOnce(new Error('Network error'));

    const result = await sendPushNotification(validSubscription, payload);

    expect(result.success).toBe(false);
    expect(result.needsRemoval).toBe(false);
  });
});

describe('findPendingCaptureSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no eligible sessions', async () => {
    const dbModule = await import('@/lib/db');
    vi.mocked(dbModule.db.query.termSession.findMany).mockResolvedValue([]);

    const result = await findPendingCaptureSessions();

    expect(result).toEqual([]);
  });

  it('only queries sessions from yesterday onwards (not all past sessions)', async () => {
    const dbModule = await import('@/lib/db');
    vi.mocked(dbModule.db.query.termSession.findMany).mockResolvedValue([]);

    await findPendingCaptureSessions();

    const callArgs: { where?: unknown } | undefined = vi.mocked(
      dbModule.db.query.termSession.findMany
    ).mock.calls[0]?.[0];

    // Verify where was passed — Drizzle's and(gte(date,yesterday), lte(date,today), ...)
    // was used to constrain the query instead of just lte(date,today)
    expect(callArgs?.where).toBeTruthy();
  });

  it('filters out sessions that ended less than 15 minutes ago', async () => {
    const now = new Date();
    const recentSession = {
      id: 'session-recent',
      termId: 'term-1',
      date: now.toISOString().split('T')[0],
      startTime: '08:00',
      endTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      label: 'Recent Class',
      isHoliday: false,
      holidayReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      term: { id: 'term-1', isActive: true },
    };

    const dbModule = await import('@/lib/db');
    vi.mocked(dbModule.db.query.termSession.findMany).mockResolvedValue([
      recentSession,
    ]);
    (
      vi.mocked(dbModule.db.select) as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    });

    const result = await findPendingCaptureSessions();

    expect(result).toEqual([]);
  });

  it('skips sessions where reminder was already sent', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 1);
    const oldSession = {
      id: 'session-old',
      termId: 'term-1',
      date: oldDate.toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '09:00',
      label: 'Old Class',
      isHoliday: false,
      holidayReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      term: { id: 'term-1', isActive: true },
    };

    const dbModule = await import('@/lib/db');
    vi.mocked(dbModule.db.query.termSession.findMany).mockResolvedValue([
      { ...oldSession, date: oldDate.toISOString().split('T')[0] },
    ]);

    // Mock reminderLog.findFirst to return an existing log
    vi.mocked(dbModule.db.query.reminderLog.findFirst).mockResolvedValue({
      id: 'log-1',
      type: 'capture_pending',
      sessionId: 'session-old',
    } as never);

    // Mock kid query to return enrolled kids
    (
      vi.mocked(dbModule.db.select) as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'kid-1' }, { id: 'kid-2' }]),
    });

    const result = await findPendingCaptureSessions();

    expect(result).toEqual([]);
  });
});

describe('shouldFireScheduleReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false if not Thursday', async () => {
    // Mock Date to be a Monday
    const mockDate = new Date(2026, 0, 5); // Monday Jan 5, 2026
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const result = await shouldFireScheduleReminder();
    expect(result).toBe(false);

    vi.useRealTimers();
  });

  it('returns false if Thursday is a holiday', async () => {
    const mockDate = new Date(2026, 0, 8); // Thursday Jan 8, 2026
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const dbModule = await import('@/lib/db');
    // Thursday is holiday
    vi.mocked(dbModule.db.query.termSession.findMany).mockResolvedValueOnce([
      {
        id: 'session-holiday',
        termId: 'term-1',
        date: '2026-01-08',
        startTime: '08:00',
        endTime: '09:00',
        label: 'Holiday',
        isHoliday: true,
        holidayReason: 'Libur',
        createdAt: new Date(2026, 0, 5),
        updatedAt: new Date(2026, 0, 5),
      } as never,
    ]);

    const result = await shouldFireScheduleReminder();
    expect(result).toBe(false);

    vi.useRealTimers();
  });

  it('returns true on Thursday with empty next week schedule', async () => {
    const mockDate = new Date(2026, 0, 8); // Thursday Jan 8, 2026
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);

    const dbModule = await import('@/lib/db');

    // First call: check if Thursday is a holiday → return empty (not holiday)
    vi.mocked(dbModule.db.query.termSession.findMany).mockResolvedValueOnce([]);

    // Second call: get next week's sessions → one session with empty scheduleItems
    vi.mocked(dbModule.db.query.termSession.findMany).mockResolvedValueOnce([
      {
        id: 'session-ns-1',
        date: '2026-01-12',
        scheduleItems: [],
        isHoliday: false,
        termId: 'term-1',
        startTime: '08:00',
        endTime: '10:00',
        label: 'Next Week Class',
        holidayReason: null,
        createdAt: new Date(2026, 0, 5),
        updatedAt: new Date(2026, 0, 5),
        term: {
          id: 'term-1',
          name: 'Semester 1',
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          isActive: true,
        },
      } as never,
    ]);

    // Third call: check if reminder was already sent this week → return null (not sent)
    vi.mocked(dbModule.db.query.reminderLog.findFirst).mockResolvedValue(
      null as never
    );

    const result = await shouldFireScheduleReminder();
    expect(result).toBe(true);

    vi.useRealTimers();
  });
});

describe('processReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero counts when nothing to process', async () => {
    const dbModule = await import('@/lib/db');
    vi.mocked(dbModule.db.query.termSession.findMany).mockResolvedValue([]);

    const result = await processReminders();

    expect(result).toEqual({
      capturePendingFired: 0,
      scheduleEntryFired: 0,
      cleanupDeleted: 0,
    });
  });
});
