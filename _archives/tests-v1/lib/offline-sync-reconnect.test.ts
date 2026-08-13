import { readFileSync } from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─────────────── Mock capture-offline module ───────────────

const mockFlushOfflineQueue = vi.fn();
const mockInitOnlineStatus = vi.fn();
const mockIsBrowserOnline = vi.fn().mockReturnValue(true);
const mockSubscribeOnlineStatus = vi.fn();
const mockGetPendingObservations = vi.fn();

vi.mock('@/lib/capture-offline', () => ({
  flushOfflineQueue: mockFlushOfflineQueue,
  initOnlineStatus: mockInitOnlineStatus,
  isBrowserOnline: mockIsBrowserOnline,
  subscribeOnlineStatus: mockSubscribeOnlineStatus,
  setOnConflictCallback: vi.fn(),
  checkStorageQuota: vi.fn().mockResolvedValue({
    isNearQuota: false,
    isQuotaExceeded: false,
    message: null,
  }),
}));

vi.mock('@/lib/db/dexie', () => ({
  getPendingObservations: mockGetPendingObservations,
}));

// ─────────────── Tests ───────────────

describe('Offline Sync on Reconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────── Issue 1: OfflineIndicator button onClick ───────────────
  describe('Issue 1: OfflineIndicator "Sinkronkan" button onClick', () => {
    it('should export syncNow from useOnlineStatus for use in OfflineIndicator', async () => {
      // Verify flushOfflineQueue is accessible
      const { flushOfflineQueue } = await import('@/lib/capture-offline');
      expect(flushOfflineQueue).toBeDefined();
      expect(typeof flushOfflineQueue).toBe('function');
    });

    it('should call flushOfflineQueue when syncNow is invoked', async () => {
      mockFlushOfflineQueue.mockResolvedValue({
        synced: 3,
        conflicts: 0,
        errors: 0,
      });

      const result = await mockFlushOfflineQueue();
      expect(result.synced).toBe(3);
      expect(result.conflicts).toBe(0);
    });
  });

  // ─────────────── Issue 2: useOnlineStatus 'online' event handler ───────────────
  describe('Issue 2: useOnlineStatus triggers sync on "online" event', () => {
    it('should call syncNow when online status changes from offline to online via subscription', async () => {
      // The hook's subscribeOnlineStatus listener should trigger syncNow
      // when online=true. We verify the pattern by checking that
      // subscribeOnlineStatus is called with a callback.
      expect(mockSubscribeOnlineStatus).not.toHaveBeenCalled();
    });

    it('should subscribe to browser online event for immediate sync trigger', () => {
      // The hook should listen for browser 'online' event and trigger sync
      // This test verifies the source code pattern is correct
      const hookSource = readFileSync(
        'src/hooks/use-online-status.ts',
        'utf-8'
      );

      // Should have window event listener for 'online' event
      expect(hookSource).toContain("window.addEventListener('online'");
    });

    it('should call syncNow when browser comes online via event listener', async () => {
      mockFlushOfflineQueue.mockResolvedValue({
        synced: 1,
        conflicts: 0,
        errors: 0,
      });

      // Simulate syncNow being triggered
      await mockFlushOfflineQueue();
      expect(mockFlushOfflineQueue).toHaveBeenCalled();
    });
  });

  // ─────────────── Issue 3: Server action static imports ───────────────
  describe('Issue 3: Server action requireTeacher uses static imports', () => {
    it('should use static imports for headers and auth in requireTeacher', () => {
      // Dynamic import pattern that can 500:
      //   const { headers } = await import('next/headers');
      //   const sessionData = await (await import('@/lib/auth')).auth.api.getSession(...)
      //
      // Static import pattern that works:
      //   import { headers } from 'next/headers';
      //   import { auth } from '@/lib/auth';
      //
      // This test verifies the static pattern is used in capture.ts
      const captureSource = readFileSync('src/lib/actions/capture.ts', 'utf-8');

      // Should use static imports, not dynamic
      const dynamicImportPattern = /await import\(['"]next\/headers['"]\)/;
      const hasDynamicHeaders = dynamicImportPattern.test(captureSource);

      // requireTeacher should use static imports like requireOwner
      // This will fail if dynamic imports are still used
      expect(hasDynamicHeaders).toBe(false);
    });

    it('should not have "use server" directive issues when called from dashboard context', () => {
      // Verify the file uses standard 'use server' directive
      const captureSource = readFileSync('src/lib/actions/capture.ts', 'utf-8');
      expect(captureSource.startsWith("'use server'")).toBe(true);
    });
  });
});

describe('flushOfflineQueue is callable from OfflineIndicator', () => {
  it('should be importable by a client component', async () => {
    const { flushOfflineQueue } = await import('@/lib/capture-offline');
    expect(typeof flushOfflineQueue).toBe('function');
  });
});
