'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { getTeacherPendingCaptureCount } from '@/lib/actions/capture';

/**
 * In-app Teacher dashboard banner showing pending capture count.
 * Polls every 5 seconds for real-time updates.
 * Tap banner to navigate to the capture/laporan screen.
 *
 * VAL-REMIN-005: Teacher sees pending capture count on dashboard open.
 * VAL-REMIN-006: Banner tap routes to pending capture screen.
 * VAL-REMIN-007: Banner disappears when Teacher completes last pending capture.
 */
export function TeacherPendingCaptureBanner() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const result = await getTeacherPendingCaptureCount();
      if (result.success) {
        setPendingCount(result.data);
      }
    } catch {
      // Silently fail — banner simply won't appear
    }
  }, []);

  useEffect(() => {
    // Defer initial fetch to avoid synchronous setState in effect body
    const raf = requestAnimationFrame(() => {
      void refreshCount();
    });

    // Poll every 5 seconds
    const interval = setInterval(refreshCount, 5000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [refreshCount]);

  // Don't render anything while loading or when count is 0
  if (pendingCount === null || pendingCount === 0) {
    return null;
  }

  return (
    <Link
      href="/dashboard/teacher/capture"
      className="mx-4 mt-2 block rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 transition-colors hover:bg-amber-100 active:bg-amber-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          <p className="text-sm font-medium text-amber-800">
            {pendingCount} capture tertunda
          </p>
        </div>
        <svg
          className="h-4 w-4 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
