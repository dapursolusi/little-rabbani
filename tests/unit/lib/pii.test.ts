import { describe, expect, it } from 'vitest';

import { detectPiiField, maskPiiFields, maskPiiValue } from '@/lib/pii';

describe('detectPiiField', () => {
  it('detects common PII fields', () => {
    expect(detectPiiField('email')).toBe('email');
    expect(detectPiiField('phone')).toBe('phone');
    expect(detectPiiField('fullName')).toBe('person_name');
    expect(detectPiiField('dateOfBirth')).toBe('date_of_birth');
  });

  it('is case insensitive', () => {
    expect(detectPiiField('EMAIL')).toBe('email');
    expect(detectPiiField('FullName')).toBe('person_name');
  });

  it('returns null for non-PII fields', () => {
    expect(detectPiiField('title')).toBeNull();
    expect(detectPiiField('description')).toBeNull();
    expect(detectPiiField('count')).toBeNull();
  });
});

describe('maskPiiValue', () => {
  it('masks person names', () => {
    expect(maskPiiValue('John Doe', 'person_name')).toBe('J*******');
  });

  it('masks emails', () => {
    expect(maskPiiValue('john@example.com', 'email')).toBe('j***@example.com');
  });

  it('masks phone numbers', () => {
    const masked = maskPiiValue('08123456789', 'phone');
    expect(masked).toContain('6789');
    expect(masked.startsWith('*')).toBe(true);
  });

  it('keeps year from date of birth', () => {
    expect(maskPiiValue('2020-06-15', 'date_of_birth')).toBe('2020');
  });

  it('masks national IDs', () => {
    const masked = maskPiiValue('123456789', 'national_id');
    expect(masked).toContain('6789');
    expect(masked).toContain('*****');
  });
});

describe('maskPiiFields', () => {
  it('masks PII fields in an object', () => {
    const data = {
      email: 'test@example.com',
      name: 'Alice',
      age: 5,
      title: 'Student',
    };

    const masked = maskPiiFields(data);

    expect(masked.email).not.toBe('test@example.com');
    expect(masked.name).not.toBe('Alice');
    expect(masked.age).toBe(5);
    expect(masked.title).toBe('Student');
  });

  it('does not modify the original object', () => {
    const data = { email: 'test@example.com' } as Record<string, unknown>;
    const copy = { ...data };
    maskPiiFields(data);
    expect(data).toEqual(copy);
  });

  it('can skip masking values', () => {
    const data = { email: 'test@example.com' } as Record<string, unknown>;
    const result = maskPiiFields(data, { maskValues: false });
    expect(result.email).toBe('test@example.com');
  });
});
