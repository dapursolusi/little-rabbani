import { describe, expect, it } from 'vitest';

import { cleanseText } from '@/utils/text';

describe('cleanseText', () => {
  it('trims whitespace', () => {
    expect(cleanseText('  hello  ')).toBe('Hello.');
  });

  it('capitalizes first letter', () => {
    expect(cleanseText('hello world')).toBe('Hello world.');
  });

  it('appends period if missing', () => {
    expect(cleanseText('hello')).toBe('Hello.');
  });

  it('does not double period', () => {
    expect(cleanseText('hello.')).toBe('Hello.');
  });

  it('preserves exclamation mark', () => {
    expect(cleanseText('hello!')).toBe('Hello!');
  });

  it('preserves question mark', () => {
    expect(cleanseText('hello?')).toBe('Hello?');
  });

  it('returns empty string for null', () => {
    expect(cleanseText(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(cleanseText(undefined)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(cleanseText('')).toBe('');
  });

  it('returns empty string for whitespace-only', () => {
    expect(cleanseText('   ')).toBe('');
  });
});
