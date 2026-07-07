// ─────────────── Idempotency Service ───────────────
// VAL-CAPTURE-040: Idempotent syncs prevent duplicates from re-sync

/**
 * Generate a unique idempotency key for an observation save.
 * Format: obs_<kidId>_<sessionId>_<timestamp>_<random>
 */
export function generateIdempotencyKey(
  kidId: string,
  sessionId: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `obs_${kidId}_${sessionId}_${timestamp}_${random}`;
}

/**
 * Parse an idempotency key to extract components.
 */
export function parseIdempotencyKey(key: string): {
  kidId: string;
  sessionId: string;
  timestamp: number;
} | null {
  const parts = key.split('_');
  if (parts.length < 4 || parts[0] !== 'obs') {
    return null;
  }
  return {
    kidId: parts[1],
    sessionId: parts[2],
    timestamp: parseInt(parts[3], 10),
  };
}

export const IdempotencyService = {
  generateKey: generateIdempotencyKey,
  parseKey: parseIdempotencyKey,
};
