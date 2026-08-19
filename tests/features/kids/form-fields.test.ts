import { kidFormFields } from '@/features/kids/form-fields';
import { KidGuardianFormSchema } from '@/features/kids/schemas';
import type { FormFieldInput } from '@/types/field';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const MODES = ['new', 'existing'] as const;

function fieldsFor(mode: (typeof MODES)[number]): FormFieldInput[] {
  return kidFormFields(() => mode).filter(
    (f): f is FormFieldInput => 'name' in f
  );
}

describe('kid form fields ↔ schema consistency', () => {
  it('every field name resolves through the schema (no bod/dob typos)', () => {
    for (const mode of MODES) {
      const variant = KidGuardianFormSchema.options.find(
        (o) => o.shape.guardianMode.value === mode
      )!;
      for (const f of fieldsFor(mode)) {
        const parts = f.name.split('.');
        let cur: unknown = variant;
        for (const p of parts) {
          cur =
            cur && typeof cur === 'object' && 'shape' in cur
              ? (cur as z.ZodObject<z.ZodRawShape>).shape[p]
              : undefined;
        }
        expect(
          cur,
          `field "${f.name}" (mode=${mode}) not found in KidGuardianFormSchema`
        ).toBeDefined();
      }
    }
  });

  it('every schema top-level key has at least one field', () => {
    const keys = new Set<string>();
    for (const variant of KidGuardianFormSchema.options) {
      for (const key of Object.keys(variant.shape)) keys.add(key);
    }
    for (const key of keys) {
      const has = MODES.some((mode) =>
        fieldsFor(mode).some((f) => f.name.split('.')[0] === key)
      );
      expect(has, `schema key "${key}" has no form field`).toBe(true);
    }
  });
});
