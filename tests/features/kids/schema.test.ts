import {
  CreateGuardianSchema,
  CreateKidSchema,
  KidGuardianFormSchema,
} from '@/features/kids/schemas';
import { describe, expect, it } from 'vitest';

describe('guardian phone identity (ADR-0001)', () => {
  it('accepts a valid local Indonesian phone', () => {
    const r = CreateGuardianSchema.safeParse({
      name: 'Ibu Rina',
      phone: '081234567890',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a non-08 phone', () => {
    const r = CreateGuardianSchema.safeParse({
      name: 'Ibu Rina',
      phone: '12345',
    });
    expect(r.success).toBe(false);
  });

  it('rejects a phone with country code / formatting', () => {
    for (const phone of ['+6281234567890', '62 812 3456 7890', '08-12-345']) {
      const r = CreateGuardianSchema.safeParse({ name: 'Ibu Rina', phone });
      expect(r.success).toBe(false);
    }
  });

  it('normalizes email to lowercase and trims', () => {
    const r = CreateGuardianSchema.safeParse({
      name: 'Ibu Rina',
      phone: '081234567890',
      email: '  BUY@Example.COM ',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('buy@example.com');
  });

  it('accepts empty optional email', () => {
    const r = CreateGuardianSchema.safeParse({
      name: 'Ibu Rina',
      phone: '081234567890',
      email: '',
    });
    expect(r.success).toBe(true);
  });
});

describe('kid form', () => {
  it('validates required kid fields', () => {
    const r = CreateKidSchema.safeParse({
      name: '',
      gender: '',
      dob: '',
      relationship: '',
    });
    expect(r.success).toBe(false);
  });

  it('accepts a complete kid payload', () => {
    const r = CreateKidSchema.safeParse({
      name: 'Budi',
      nickName: 'Budi',
      gender: 'male',
      dob: '2021-05-10',
      relationship: 'mother',
    });
    expect(r.success).toBe(true);
  });
});

describe('combined kid + guardian form', () => {
  it('validates nested kid and guardian', () => {
    const r = KidGuardianFormSchema.safeParse({
      kid: {
        name: 'Budi',
        nickName: 'Budi',
        gender: 'male',
        dob: '2021-05-10',
        relationship: 'mother',
      },
      guardian: {
        name: 'Ibu Rina',
        phone: '081234567890',
      },
    });
    expect(r.success).toBe(true);
  });
});
