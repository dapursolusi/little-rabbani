import type { SessionType } from '@/features/sessionType/types';

export interface ResolvedSessionType {
  id: string;
  name: string;
  start: string;
  end: string;
}

/**
 * Given all session type rows, find which one was active for `name` at
 * `targetDate`. This is a pure function — no DB or side effects.
 *
 * Versioning model: when a session type's time changes, the old row is
 * deactivated (active=false, updatedAt reflects when) and a new active
 * row is inserted. Historical captures resolve to whichever row was
 * active at the time.
 *
 * - 0 matching rows → null
 * - 1 matching row → always that row (past or future)
 * - Multiple rows → sort by createdAt, find which row's validity range
 *   covers targetDate. An active row is valid from its createdAt onward;
 *   a deactivated row is valid from its createdAt to its updatedAt
 *   (the deactivation timestamp).
 */
export function resolveSessionType(
  rows: SessionType[],
  name: string,
  targetDate: string
): ResolvedSessionType | null {
  const matching = rows.filter((r) => r.name === name && !r.deletedAt);
  if (matching.length === 0) return null;
  if (matching.length === 1) return pick(matching[0]);

  // Multiple rows — sort newest first, build timeline
  const sorted = [...matching].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const target = new Date(targetDate);

  // For each row, check if targetDate falls in its validity range
  for (const row of sorted) {
    const rangeStart = row.createdAt;
    const rangeEnd = row.active ? new Date(8640000000000000) : row.updatedAt; // far future for active row
    if (target >= rangeStart && target < rangeEnd) return pick(row);
  }

  // Fallback: return currently active row
  const active = sorted.find((r) => r.active);
  return active ? pick(active) : pick(sorted[0]);
}

function pick(row: SessionType): ResolvedSessionType {
  return { id: row.id, name: row.name, start: row.start, end: row.end };
}
