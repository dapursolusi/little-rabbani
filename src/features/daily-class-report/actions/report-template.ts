'use server';
import z from 'zod';

import { parseInput } from '@/lib/action/parse-input';
import { requireOwner } from '@/lib/action/require-owner';

import * as templateService from '../services/report-template';

export async function getDefaultTemplate() {
  return await templateService.getDefaultTemplate();
}

export async function saveTemplate(input: unknown) {
  const parsed = parseInput({
    schema: z.object({ content: z.string().min(1, 'Template wajib diisi') }),
    input,
    fallbackError: 'Data template tidak valid',
  });
  if (!parsed.success) return parsed;
  return requireOwner(() => templateService.saveTemplate(parsed.data));
}
