import { kidFormFields } from '@/features/kids/form-fields';
import { KidGuardianFormSchema } from '@/features/kids/schemas';
import type { FormFieldInput } from '@/types/field';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('kid form fields ↔ schema consistency', () => {
  const inputs = kidFormFields().filter(
    (f): f is FormFieldInput => 'name' in f
  );
  const schemaShape = KidGuardianFormSchema.shape as Record<
    string,
    z.ZodType
  >;

  it('every field name resolves through the schema (no bod/dob typos)', () => {
    for (const f of inputs) {
      // dot-path e.g. "kid.dob" → traverse schema.shape
      const parts = f.name.split('.');
      let cur: unknown = KidGuardianFormSchema;
      for (const p of parts) {
        cur =
          cur && typeof cur === 'object' && 'shape' in cur
            ? (cur as z.ZodObject<z.ZodRawShape>).shape[p]
            : undefined;
      }
      expect(cur, `field "${f.name}" not found in KidGuardianFormSchema`).toBeDefined();
    }
  });

  it('every schema top-level key has at least one field', () => {
    for (const key of Object.keys(schemaShape)) {
      const has = inputs.some((f) => f.name.split('.')[0] === key);
      expect(has, `schema key "${key}" has no form field`).toBe(true);
    }
  });
});
