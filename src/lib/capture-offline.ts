'use client';

import { savePass1Observation } from '@/lib/actions/capture';
import { generateIdempotencyKey } from '@/lib/idempotency';

// ─────────────── Types ───────────────

export interface IConflictData {
  type: 'conflict';
  kidId: string;
  sessionId: string;
  serverFields: {
    mood: number;
    appetite: string;
    presence: string;
  };
  serverNotes: string[];
  localNotes: string[];
  serverVersion: number;
  localVersion: number;
  syncQueueId: number;
}

export type TConflictCallback = (conflict: IConflictData) => void;

export interface IOnlineStatusInfo {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

// ─────────────── Online Status ───────────────

let onlineStatusListeners: Array<(isOnline: boolean) => void> = [];

/**
 * Initialize online/offline listeners.
 */
export function initOnlineStatus(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => {
    onlineStatusListeners.forEach((fn) => fn(true));
  });
  window.addEventListener('offline', () => {
    onlineStatusListeners.forEach((fn) => fn(false));
  });
}

/**
 * Subscribe to online status changes.
 * Returns unsubscribe function.
 */
export function subscribeOnlineStatus(
  listener: (isOnline: boolean) => void
): () => void {
  onlineStatusListeners.push(listener);
  return () => {
    onlineStatusListeners = onlineStatusListeners.filter((l) => l !== listener);
  };
}

/**
 * Check if the browser is currently online.
 */
export function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

// ─────────────── Sync Logic ───────────────

let isSyncing = false;
let conflicts: IConflictData[] = [];
let onConflictCallback: TConflictCallback | null = null;

/**
 * Set the conflict callback that will be invoked when sync conflicts are detected.
 */
export function setOnConflictCallback(
  callback: TConflictCallback | null
): void {
  onConflictCallback = callback;
}

/**
 * Flush pending offline observations to the server.
 * Returns summary of sync results.
 * VAL-CAPTURE-037: Sync on reconnect within recall window.
 * VAL-CAPTURE-038: Conflicts surfaced on offline flush (same UI as online).
 * VAL-CAPTURE-040: Idempotent syncs prevent duplicates.
 */
export async function flushOfflineQueue(): Promise<{
  synced: number;
  conflicts: number;
  errors: number;
}> {
  if (isSyncing) return { synced: 0, conflicts: 0, errors: 0 };
  isSyncing = true;

  try {
    const {
      getPendingObservations,
      removeSyncedObservation,
      storeIdempotencyKey,
      hasIdempotencyKey,
      updateSyncStatus,
    } = await import('@/lib/db/dexie');

    const pendingItems = await getPendingObservations();
    if (pendingItems.length === 0) {
      return { synced: 0, conflicts: 0, errors: 0 };
    }

    let synced = 0;
    let conflictCount = 0;
    let errors = 0;

    for (const item of pendingItems) {
      // VAL-CAPTURE-040: Check idempotency - skip if already synced
      const alreadySynced = await hasIdempotencyKey(item.idempotencyKey);
      if (alreadySynced) {
        await removeSyncedObservation(item.id!);
        synced++;
        continue;
      }

      try {
        // Mark as syncing
        await updateSyncStatus(item.id!, 'syncing');

        const formData = new FormData();
        formData.append('kidId', item.kidId);
        formData.append('sessionId', item.sessionId);
        formData.append('mood', String(item.mood));
        formData.append('appetite', item.appetite);
        formData.append('presence', item.presence);
        if (item.absenceReason) {
          formData.append('absenceReason', item.absenceReason);
        }
        if (item.notes) {
          formData.append('notes', item.notes);
        }
        formData.append('idempotencyKey', item.idempotencyKey);

        const result = await savePass1Observation(formData);

        if (result.success) {
          // Successfully synced
          await storeIdempotencyKey(item.idempotencyKey);
          await removeSyncedObservation(item.id!);
          synced++;
        } else if (
          result.error &&
          result.error.toLowerCase().includes('sudah diubah')
        ) {
          // Version conflict - VAL-CAPTURE-038
          await updateSyncStatus(item.id!, 'conflict', result.error);
          conflictCount++;

          // Fetch server values to surface in conflict UI
          try {
            const { getKidObservation } = await import('@/lib/actions/capture');
            const serverObs = await getKidObservation(
              item.kidId,
              item.sessionId
            );

            if (serverObs.success && serverObs.data) {
              const conflictData: IConflictData = {
                type: 'conflict',
                kidId: item.kidId,
                sessionId: item.sessionId,
                serverFields: {
                  mood: serverObs.data.mood,
                  appetite: serverObs.data.appetite,
                  presence: serverObs.data.presence,
                },
                serverNotes: (serverObs.data.notes ?? []).map(
                  (n: { text: string }) => n.text
                ),
                localNotes: item.notes ? [item.notes] : [],
                serverVersion: serverObs.data.version,
                localVersion: item.version,
                syncQueueId: item.id!,
              };
              conflicts.push(conflictData);

              // Invoke callback if set
              if (onConflictCallback) {
                onConflictCallback(conflictData);
              }
            }
          } catch {
            // Failed to fetch server data, conflict remains
          }
        } else {
          // Other error
          const retryCount = (item.retryCount ?? 0) + 1;
          await updateSyncStatus(
            item.id!,
            retryCount > 3 ? 'conflict' : 'pending',
            result.error
          );
          errors++;
        }
      } catch {
        // Network or other error during sync
        await updateSyncStatus(item.id!, 'pending', 'Gagal sinkronisasi');
        errors++;
      }
    }

    return { synced, conflicts: conflictCount, errors };
  } finally {
    isSyncing = false;
  }
}

/**
 * Get pending conflict data for display.
 */
export function getPendingConflicts(): IConflictData[] {
  return conflicts;
}

/**
 * Clear resolved conflicts from tracking.
 */
export function clearResolvedConflicts(syncQueueId: number): void {
  conflicts = conflicts.filter((c) => c.syncQueueId !== syncQueueId);
}

// ─────────────── Quota Warning ───────────────

/**
 * Check if storage is near quota and return warning message if so.
 * VAL-CAPTURE-041: Offline queue full shows quota warning.
 */
export async function checkStorageQuota(): Promise<{
  isNearQuota: boolean;
  isQuotaExceeded: boolean;
  message: string | null;
}> {
  try {
    const { estimateStorageUsage } = await import('@/lib/db/dexie');
    const usage = await estimateStorageUsage();

    if (usage.isQuotaExceeded) {
      return {
        isNearQuota: true,
        isQuotaExceeded: true,
        message: 'Penyimpanan offline penuh — tidak dapat menyimpan data baru',
      };
    }

    if (usage.isNearQuota) {
      return {
        isNearQuota: true,
        isQuotaExceeded: false,
        message: 'Penyimpanan offline hampir penuh — segera sinkronkan data',
      };
    }

    return {
      isNearQuota: false,
      isQuotaExceeded: false,
      message: null,
    };
  } catch {
    return {
      isNearQuota: false,
      isQuotaExceeded: false,
      message: null,
    };
  }
}

/**
 * Generate a unique idempotency key for offline saves.
 */
export { generateIdempotencyKey };
