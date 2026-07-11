import { describe, expect, it } from 'vitest';

import { buildKeepLocalPayload } from '@/lib/capture-offline';
import type { IConflictData } from '@/lib/capture-offline';

describe('buildKeepLocalPayload', () => {
  const baseConflict: IConflictData = {
    type: 'conflict',
    kidId: 'kid-1',
    sessionId: 'session-1',
    serverFields: {
      mood: 3,
      appetite: 'moderate',
      presence: 'present_full',
    },
    localFields: {
      mood: 5,
      appetite: 'good',
      presence: 'late',
    },
    serverNotes: ['Catatan server'],
    localNotes: ['Catatan lokal'],
    serverVersion: 2,
    localVersion: 1,
    syncQueueId: 42,
  };

  it('uses local mood, appetite, and presence', () => {
    const result = buildKeepLocalPayload(baseConflict);
    expect(result.mood).toBe('5');
    expect(result.appetite).toBe('good');
    expect(result.presence).toBe('late');
  });

  it('merges notes append-only: server first, then local', () => {
    const result = buildKeepLocalPayload(baseConflict);
    expect(result.notes).toContain('Catatan server');
    expect(result.notes).toContain('Catatan lokal');
    expect(result.notes.indexOf('Catatan server')).toBeLessThan(
      result.notes.indexOf('Catatan lokal')
    );
  });

  it('returns presence as local value (not derived from notes)', () => {
    const noNotesConflict: IConflictData = {
      ...baseConflict,
      localNotes: [],
      localFields: { mood: 1, appetite: 'poor', presence: 'absent' },
    };
    const result = buildKeepLocalPayload(noNotesConflict);
    expect(result.presence).toBe('absent');
  });

  it('uses server version so save succeeds', () => {
    const result = buildKeepLocalPayload(baseConflict);
    expect(result.version).toBe('2');
  });
});
