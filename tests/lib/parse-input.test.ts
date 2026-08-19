import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { parseInput } from '@/lib/actions/parse-input';

const schema = z.object({
  name: z.string().min(2, 'Nama wajib diisi'),
});

describe('parseInput', () => {
  it('returns the parsed data on success', () => {
    const r = parseInput(schema, { name: 'Budi' }, 'Fallback');
    expect(r).toEqual({ success: true, data: { name: 'Budi' } });
  });

  it('returns the first issue message on failure', () => {
    const r = parseInput(schema, { name: '' }, 'Fallback');
    expect(r).toEqual({ success: false, error: 'name: Nama wajib diisi' });
  });

  it('prefixes the issue with its field path', () => {
    // The createKid bug: parsing the whole { kid, guardian } envelope against
    // the flat kid schema. Envelope has a `kid` key, so zod descends and fails
    // on the missing inner field — the path tells you which one.
    const flatKid = z.object({
      name: z.string().min(2, 'Nama wajib diisi'),
      dob: z.string().min(1, 'Tanggal lahir wajib diisi'),
    });
    const r = parseInput(flatKid, { kid: { name: 'GT1' } }, 'Fallback');
    expect(r).toEqual({
      success: false,
      error: 'name: Invalid input: expected string, received undefined',
    });
  });
});
