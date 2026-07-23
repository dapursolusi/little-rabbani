'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getPendingObservations } from '@/db/dexie';

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

  // Use ref for isSyncing to avoid stale closure in event handlers
  const isSyncingRef = useRef(false);

  const updateCount = useCallback(async () => {
    try {
      const items = await getPendingObservations();
      setState((prev) => ({ ...prev, pendingCount: items.length }));
    } catch {
      // Dexie not available
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setState((prev) => ({ ...prev, isSyncing: true }));
    try {
      const result = await flushOfflineQueue();
      isSyncingRef.current = false;
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: result,
        pendingCount: 0,
      }));

      // Re-count pending
      await updateCount();
    } catch {
      isSyncingRef.current = false;
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [updateCount]);

  useEffect(() => {
    // Initialize online status
    initOnlineStatus();

    // Subscribe to online status changes from initOnlineStatus
    const unsubscribe = subscribeOnlineStatus((online) => {
      setState((prev) => ({ ...prev, isOnline: online }));
      // VAL-CAPTURE-037: Trigger immediate sync when browser comes online
      if (online) {
        updateCount().then(() => syncNow());
      }
    });

    // Check pending count on mount
    // Use timeout to avoid cascading renders within effect
    const initialCheck = setTimeout(() => {
      updateCount();
    }, 0);

    // Listen for browser 'online' event directly (immediate sync trigger)
    // VAL-CAPTURE-037: Sync on browser 'online' event
    const handleBrowserOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      updateCount().then(() => syncNow());
    };
    const handleBrowserOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleBrowserOnline);
      window.addEventListener('offline', handleBrowserOffline);
    }

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
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleBrowserOnline);
        window.removeEventListener('offline', handleBrowserOffline);
      }
    };
  }, [syncNow, updateCount]);

  return {
    ...state,
    syncNow,
  };
}
