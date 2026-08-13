import type { SessionType } from '@/features/sessionType/types';
import { describe, expect, it } from 'vitest';

import { resolveSessionType } from '@/lib/session-type-resolver';

// ─── Helpers ───────────────────────────────────────────────
function makeRow(
  overrides: Partial<SessionType> & { name: string }
): SessionType {
  const now = new Date('2026-01-01T00:00:00Z');
  return {
    id: 'st-1',
    start: '08:00',
    end: '10:00',
    active: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as SessionType;
}

describe('resolveSessionType', () => {
  // ─── Single row ───────────────────────────────────────────
  it('returns a single active row for any date', () => {
    const row = makeRow({ name: 'Morning', id: 'st-1' });
    const result = resolveSessionType([row], 'Morning', '2024-06-15');
    expect(result).toEqual({
      id: 'st-1',
      name: 'Morning',
      start: '08:00',
      end: '10:00',
    });
  });

  it('returns a single deactivated row for any date', () => {
    const row = makeRow({
      name: 'Morning',
      id: 'st-1',
      active: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-01'),
    });
    const result = resolveSessionType([row], 'Morning', '2024-03-15');
    expect(result).toEqual({
      id: 'st-1',
      name: 'Morning',
      start: '08:00',
      end: '10:00',
    });
  });

  // ─── Deactivated row returned for dates before deactivation ──
  it('returns deactivated row for dates before its deactivation', () => {
    const old = makeRow({
      name: 'Morning',
      id: 'st-old',
      active: false,
      start: '08:00',
      end: '10:00',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-15'), // deactivated on June 15
    });
    const current = makeRow({
      name: 'Morning',
      id: 'st-new',
      active: true,
      start: '09:00',
      end: '11:00',
      createdAt: new Date('2024-06-15'),
      updatedAt: new Date('2024-06-15'),
    });

    // Before deactivation → old row
    expect(resolveSessionType([old, current], 'Morning', '2024-06-14')).toEqual(
      {
        id: 'st-old',
        name: 'Morning',
        start: '08:00',
        end: '10:00',
      }
    );
  });

  // ─── New active row returned for dates after deactivation ──
  it('returns new active row for dates after deactivation', () => {
    const old = makeRow({
      name: 'Morning',
      id: 'st-old',
      active: false,
      start: '08:00',
      end: '10:00',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-15'),
    });
    const current = makeRow({
      name: 'Morning',
      id: 'st-new',
      active: true,
      start: '09:00',
      end: '11:00',
      createdAt: new Date('2024-06-15'),
      updatedAt: new Date('2024-06-15'),
    });

    // After deactivation → current (new) row
    expect(resolveSessionType([old, current], 'Morning', '2024-06-16')).toEqual(
      {
        id: 'st-new',
        name: 'Morning',
        start: '09:00',
        end: '11:00',
      }
    );
  });

  // ─── No matching name ──────────────────────────────────────
  it('returns null when no rows match the name', () => {
    const row = makeRow({ name: 'Morning' });
    const result = resolveSessionType([row], 'Afternoon', '2024-06-15');
    expect(result).toBeNull();
  });

  // ─── Same-name-same-time edit is idempotent ────────────────
  it('returns the same result for same-name same-time rows (edit idempotent)', () => {
    // Simulates an in-place edit where the row content changed but timestamps are identical
    const row = makeRow({
      name: 'Morning',
      id: 'st-1',
      start: '08:00',
      end: '10:00',
    });
    const result1 = resolveSessionType([row], 'Morning', '2024-06-15');
    const result2 = resolveSessionType([row], 'Morning', '2024-07-01');
    expect(result1).toEqual(result2);
  });

  // ─── Future date resolves to currently active row ──────────
  it('resolves future dates to the currently active row', () => {
    const old = makeRow({
      name: 'Morning',
      id: 'st-old',
      active: false,
      start: '08:00',
      end: '10:00',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-15'),
    });
    const current = makeRow({
      name: 'Morning',
      id: 'st-new',
      active: true,
      start: '09:00',
      end: '11:00',
      createdAt: new Date('2024-06-15'),
      updatedAt: new Date('2024-06-15'),
    });

    // Far future → current active row
    expect(resolveSessionType([old, current], 'Morning', '2026-01-01')).toEqual(
      {
        id: 'st-new',
        name: 'Morning',
        start: '09:00',
        end: '11:00',
      }
    );
  });

  // ─── Exact boundary at createdAt ───────────────────────────
  it('resolves date equal to new rows createdAt to the new row', () => {
    const old = makeRow({
      name: 'Morning',
      id: 'st-old',
      active: false,
      start: '08:00',
      end: '10:00',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-15'),
    });
    const current = makeRow({
      name: 'Morning',
      id: 'st-new',
      active: true,
      start: '09:00',
      end: '11:00',
      createdAt: new Date('2024-06-15'),
      updatedAt: new Date('2024-06-15'),
    });

    // targetDate === current.createdAt → new row is valid from its createdAt
    expect(resolveSessionType([old, current], 'Morning', '2024-06-15')).toEqual(
      {
        id: 'st-new',
        name: 'Morning',
        start: '09:00',
        end: '11:00',
      }
    );
  });

  // ─── Excludes deleted rows ─────────────────────────────────
  it('excludes soft-deleted rows', () => {
    const deleted = makeRow({
      name: 'Morning',
      id: 'st-deleted',
      active: false,
      deletedAt: new Date('2024-12-01'),
    });
    const result = resolveSessionType([deleted], 'Morning', '2026-06-15');
    expect(result).toBeNull();
  });
});
