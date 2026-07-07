import { Dexie, type EntityTable } from 'dexie';

// ─────────────── Types ───────────────

export interface IOfflineObservation {
  id?: number;
  kidId: string;
  sessionId: string;
  teacherId: string;
  mood: number;
  appetite: 'good' | 'moderate' | 'poor';
  presence: 'present_full' | 'late' | 'early_pickup' | 'absent';
  absenceReason: string | null;
  notes: string;
  capturedAt: string;
  idempotencyKey: string;
  version: number;
  createdAt: number;
}

export interface ISyncQueueItem {
  id?: number;
  kidId: string;
  sessionId: string;
  teacherId: string;
  mood: number;
  appetite: string;
  presence: string;
  absenceReason: string | null;
  notes: string;
  capturedAt: string;
  idempotencyKey: string;
  version: number;
  status: 'pending' | 'syncing' | 'conflict' | 'synced';
  retryCount: number;
  errorMessage: string | null;
  createdAt: number;
}

export interface IIdempotencyRecord {
  key: string;
  createdAt: number;
}

// ─────────────── Dexie Database ───────────────

class CaptureDatabase extends Dexie {
  observations!: EntityTable<IOfflineObservation, 'id'>;
  syncQueue!: EntityTable<ISyncQueueItem, 'id'>;
  idempotencyKeys!: EntityTable<IIdempotencyRecord, 'key'>;

  constructor() {
    super('LittleRabbaniCapture');

    this.version(1).stores({
      observations:
        '++id, kidId, sessionId, teacherId, idempotencyKey, createdAt',
      syncQueue: '++id, kidId, sessionId, idempotencyKey, status, createdAt',
      idempotencyKeys: 'key, createdAt',
    });
  }
}

export const captureDb = new CaptureDatabase();

// ─────────────── Offline Store Operations ───────────────

/**
 * Save an observation to the offline Dexie store.
 * VAL-CAPTURE-036: Captures queue in IndexedDB when network drops.
 */
export async function saveObservationOffline(
  observation: Omit<IOfflineObservation, 'id' | 'createdAt'>
): Promise<number> {
  const id = await captureDb.observations.add({
    ...observation,
    createdAt: Date.now(),
  } as IOfflineObservation);

  // Also add to sync queue
  await captureDb.syncQueue.add({
    kidId: observation.kidId,
    sessionId: observation.sessionId,
    teacherId: observation.teacherId,
    mood: observation.mood,
    appetite: observation.appetite,
    presence: observation.presence,
    absenceReason: observation.absenceReason,
    notes: observation.notes,
    capturedAt: observation.capturedAt,
    idempotencyKey: observation.idempotencyKey,
    version: observation.version,
    status: 'pending',
    retryCount: 0,
    errorMessage: null,
    createdAt: Date.now(),
  } as ISyncQueueItem);

  return id as number;
}

/**
 * Get all pending observations from the sync queue.
 * VAL-CAPTURE-037: Sync on reconnect within recall window.
 */
export async function getPendingObservations(): Promise<ISyncQueueItem[]> {
  return captureDb.syncQueue.where('status').equals('pending').toArray();
}

/**
 * Update sync queue item status.
 */
export async function updateSyncStatus(
  id: number,
  status: ISyncQueueItem['status'],
  errorMessage?: string
): Promise<void> {
  await captureDb.syncQueue.update(id, {
    status,
    ...(errorMessage ? { errorMessage } : {}),
  });
}

/**
 * Remove a synced observation from the queue and observation store.
 * VAL-CAPTURE-037: Clean up after successful sync.
 */
export async function removeSyncedObservation(syncId: number): Promise<void> {
  const item = await captureDb.syncQueue.get(syncId);
  if (item) {
    // Remove from observation store
    await captureDb.observations
      .where('idempotencyKey')
      .equals(item.idempotencyKey)
      .delete();
  }
  // Remove from sync queue
  await captureDb.syncQueue.delete(syncId);
}

/**
 * Store an idempotency key after successful server sync.
 * VAL-CAPTURE-040: Idempotent syncs prevent duplicates.
 */
export async function storeIdempotencyKey(key: string): Promise<void> {
  await captureDb.idempotencyKeys.add({
    key,
    createdAt: Date.now(),
  });
}

/**
 * Check if an idempotency key already exists.
 */
export async function hasIdempotencyKey(key: string): Promise<boolean> {
  const record = await captureDb.idempotencyKeys.get(key);
  return !!record;
}

/**
 * Get sync queue items with conflict status.
 * VAL-CAPTURE-038: Conflicts surfaced on offline flush.
 */
export async function getConflictItems(): Promise<ISyncQueueItem[]> {
  return captureDb.syncQueue.where('status').equals('conflict').toArray();
}

/**
 * Get the total count of items in the offline queue.
 * VAL-CAPTURE-041: Quota warning when near full.
 */
export async function getOfflineQueueSize(): Promise<number> {
  return captureDb.syncQueue.count();
}

/**
 * Clear old idempotency keys (older than 24 hours).
 */
export async function pruneOldIdempotencyKeys(): Promise<void> {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  await captureDb.idempotencyKeys.where('createdAt').below(oneDayAgo).delete();
}

/**
 * Estimate storage usage.
 * VAL-CAPTURE-041: Check storage quota.
 */
export async function estimateStorageUsage(): Promise<{
  usagePercent: number;
  usage: number;
  quota: number;
  isNearQuota: boolean;
  isQuotaExceeded: boolean;
}> {
  let usage = 0;
  let quota = 0;

  if (typeof navigator !== 'undefined' && 'storage' in navigator) {
    try {
      const estimate = await navigator.storage.estimate();
      usage = estimate.usage ?? 0;
      quota = estimate.quota ?? 0;
    } catch {
      // Fallback: estimate based on queue size
      const queueSize = await getOfflineQueueSize();
      usage = queueSize * 1024; // rough estimate: ~1KB per item
      quota = 50 * 1024 * 1024; // assume 50MB
    }
  }

  const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;

  return {
    usagePercent,
    usage,
    quota,
    isNearQuota: usagePercent >= 80,
    isQuotaExceeded: usagePercent >= 100,
  };
}
