'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { getOwnerPendingCaptureCount } from '@/lib/actions/reminder-settings';

/**
 * Component that registers the Service Worker and sets up push
 * notifications on the client side. Silently handles cases where
 * Service Worker is not supported.
 *
 * VAL-REMIN-012: Service Worker registered successfully.
 * VAL-REMIN-016: Service Worker not supported -> silently disabled.
 * VAL-REMIN-011: Notification permission denied -> in-app fallback badge.
 * VAL-REMIN-018: Badge updates in real-time when captures completed.
 */
export function PushNotificationSetup() {
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPendingCount = useCallback(async () => {
    const result = await getOwnerPendingCaptureCount();
    if (result.success) {
      setPendingCount(result.data);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Service Worker is supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Check if Notification API is supported
    if (!('Notification' in window)) {
      return;
    }

    // Register Service Worker
    const setup = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Subscribe to push if permission is granted
        if (Notification.permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            // Subscription handled by settings page
          }
        }

        await refreshPendingCount();

        const interval = setInterval(refreshPendingCount, 30000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('[SW] Registration failed:', error);
      }
    };

    setup();
  }, [refreshPendingCount]);

  // If permission is denied and there are pending captures, show badge
  if (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'denied' &&
    pendingCount > 0
  ) {
    return (
      <Link
        href="/dashboard/owner/dcr"
        className="relative inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200"
        title={`${pendingCount} capture tertunda`}
      >
        <span className="flex h-2 w-2 rounded-full bg-amber-500" />
        {pendingCount} tertunda
      </Link>
    );
  }

  // Don't render anything for other states
  return null;
}

/**
 * Hook to get the pending capture count for use in other components.
 */
export function usePendingCaptureCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      const result = await getOwnerPendingCaptureCount();
      if (!cancelled && result.success) {
        setCount(result.data);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { count };
}
