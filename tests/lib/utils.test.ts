import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names without conflicts', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });

  it('handles conditional classes via object syntax', () => {
    const result = cn('base', { active: true, hidden: false });
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('hidden');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    // twMerge should keep the last conflicting class
    const result = cn('px-4', 'px-6');
    expect(result).not.toContain('px-4');
    expect(result).toContain('px-6');
  });

  it('handles array arguments', () => {
    const result = cn(['px-2', 'py-1'], 'mt-4');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('mt-4');
  });

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('filters out falsy values', () => {
    const result = cn('visible', false && 'hidden', null, undefined, 0 as unknown as string);
    expect(result).toBe('visible');
  });
});
