'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  flushOfflineQueue,
  initOnlineStatus,
  isBrowserOnline,
  subscribeOnlineStatus,
} from '@/lib/capture-offline';

// ─────────────── Online Status Hook ───────────────
// VAL-CAPTURE-039: Offline indicator visible to teacher
// VAL-CAPTURE-037: Sync on reconnect

export interface IOnlineStatusState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncResult: {
    synced: number;
    conflicts: number;
    errors: number;
  } | null;
}

export function useOnlineStatus(): IOnlineStatusState & {
  syncNow: () => Promise<void>;
} {
  const [state, setState] = useState<IOnlineStatusState>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncResult: null,
  }));

  const updateCount = useCallback(async () => {
    try {
      const { getPendingObservations } = await import('@/lib/db/dexie');
      const items = await getPendingObservations();
      setState((prev) => ({ ...prev, pendingCount: items.length }));
    } catch {
      // Dexie not available
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (state.isSyncing) return;

    setState((prev) => ({ ...prev, isSyncing: true }));
    try {
      const result = await flushOfflineQueue();
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: result,
        pendingCount: 0,
      }));

      // Re-count pending
      await updateCount();
    } catch {
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [state.isSyncing, updateCount]);

  useEffect(() => {
    // Initialize online status
    initOnlineStatus();

    // Subscribe to changes
    const unsubscribe = subscribeOnlineStatus((online) => {
      setState((prev) => ({ ...prev, isOnline: online }));
    });

    // Check pending count on mount
    // Use timeout to avoid cascading renders within effect
    const initialCheck = setTimeout(() => {
      updateCount();
    }, 0);

    // Periodic sync check
    const interval = setInterval(() => {
      updateCount();
      if (isBrowserOnline()) {
        syncNow();
      }
    }, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
      clearTimeout(initialCheck);
    };
  }, [syncNow, updateCount]);

  return {
    ...state,
    syncNow,
  };
}
