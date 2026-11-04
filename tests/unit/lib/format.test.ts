import { describe, expect, it } from 'vitest';

import { formatDateShort } from '@/lib/format';

describe('formatDateShort', () => {
  it('formats with short Indonesian month', () => {
    expect(formatDateShort('2026-08-11')).toBe('Selasa, 11 Agu');
  });
});
