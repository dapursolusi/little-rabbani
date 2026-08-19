import { CreateGuardianSchema, CreateKidSchema } from '@/features/kids/schemas';
import { describe, expect, it } from 'vitest';

// Regression: untouched optional fields submit as `undefined` (RHF), and the
// strict action schema used to reject them with "expected string, received
// undefined". The DB columns are nullable, so the action schema must accept
// undefined/null for those.
describe('untouched optional fields submit as undefined', () => {
  const kid = {
    name: 'GT1 Child 1',
    nickName: undefined, // untouched → RHF leaves undefined
    gender: 'male',
    dob: '2022-01-20',
    relationship: 'mother',
  };
  const guardian = {
    name: 'Guardian Test 1',
    phone: '0812000001',
    email: 'gt1@mail.com',
    secondContactName: undefined,
    secondContactPhone: undefined,
  };

  it('CreateKidSchema accepts nickName: undefined', () => {
    const r = CreateKidSchema.safeParse(kid);
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });

  it('CreateGuardianSchema accepts secondContact*: undefined', () => {
    const r = CreateGuardianSchema.safeParse(guardian);
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });
});
