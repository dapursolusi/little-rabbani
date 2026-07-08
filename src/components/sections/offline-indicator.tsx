'use client';

import { useEffect, useState } from 'react';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';

import { checkStorageQuota } from '@/lib/capture-offline';

// ─────────────── Offline Indicator ───────────────
// VAL-CAPTURE-039: Offline indicator visible to teacher while offline
// VAL-CAPTURE-041: Quota warning when IndexedDB near full

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, lastSyncResult, syncNow } =
    useOnlineStatus();
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Check storage quota periodically
  useEffect(() => {
    const checkQuota = async () => {
      try {
        const quota = await checkStorageQuota();
        setQuotaMessage(quota.message);
      } catch {
        // Dexie not available
      }
    };

    checkQuota();
    const interval = setInterval(checkQuota, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Show sync toast when sync completes
  useEffect(() => {
    if (
      lastSyncResult &&
      (lastSyncResult.synced > 0 ||
        lastSyncResult.conflicts > 0 ||
        lastSyncResult.errors > 0)
    ) {
      const parts: string[] = [];
      if (lastSyncResult.synced > 0) {
        parts.push(`${lastSyncResult.synced} tersimpan`);
      }
      if (lastSyncResult.conflicts > 0) {
        parts.push(`${lastSyncResult.conflicts} konflik`);
      }
      if (lastSyncResult.errors > 0) {
        parts.push(`${lastSyncResult.errors} gagal`);
      }

      const message = `Sinkronisasi: ${parts.join(', ')}`;
      // Use microtask to avoid cascading renders
      const id = setTimeout(() => {
        setSyncToast(message);
      }, 0);
      const clearId = setTimeout(() => setSyncToast(null), 4000);

      return () => {
        clearTimeout(id);
        clearTimeout(clearId);
      };
    }
  }, [lastSyncResult]);

  return (
    <>
      {/* VAL-CAPTURE-039: Offline indicator */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-white" />
            <span>
              Offline — data akan tersimpan secara lokal
              {pendingCount > 0 && ` (${pendingCount} antrean)`}
            </span>
          </div>
        </div>
      )}

      {/* Syncing indicator */}
      {isSyncing && (
        <div className="sticky top-0 z-50 bg-blue-500 px-4 py-1.5 text-center text-xs font-medium text-white">
          <div className="flex items-center justify-center gap-2">
            <HugeiconsIcon
              icon={Loading03Icon}
              className="h-3 w-3 animate-spin text-white"
            />
            <span>Menyinkronkan data offline...</span>
          </div>
        </div>
      )}

      {/* Sync toast */}
      {syncToast && (
        <div className="sticky top-0 z-50 bg-green-500 px-4 py-1.5 text-center text-xs font-medium text-white transition-all">
          {syncToast}
        </div>
      )}

      {/* VAL-CAPTURE-041: Quota warning */}
      {quotaMessage && isOnline && (
        <div className="sticky top-0 z-50 bg-red-500 px-4 py-1.5 text-center text-xs font-medium text-white">
          ⚠️ {quotaMessage}
        </div>
      )}

      {/* Pending count badge (when online with pending items) */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <div className="sticky top-0 z-50 bg-blue-600 px-4 py-1.5 text-center text-xs font-medium text-white">
          <Button
            type="button"
            variant="ghost"
            onClick={syncNow}
            className="flex items-center justify-center gap-2 underline h-auto"
          >
            <span>{pendingCount} data offline menunggu sinkronisasi</span>
            <span className="underline">Sinkronkan</span>
          </Button>
        </div>
      )}
    </>
  );
}
