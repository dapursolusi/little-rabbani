'use server';

import { parseInput } from '@/lib/actions/parse-input';

import { subThemeFormSchema, themeFormSchema } from './schema';
import * as themeService from './services';

export async function getThemes(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return themeService.getThemes(params);
}

export async function getTheme(id: string) {
  return themeService.getTheme(id);
}

export async function createTheme(input: Record<string, unknown>) {
  const parsed = parseInput({
    schema: themeFormSchema,
    input,
    fallbackError: 'Data tema tidak valid',
  });
  if (!parsed.success) return parsed;

  return themeService.createTheme(parsed.data);
}

export async function updateTheme(id: string, input: Record<string, unknown>) {
  const parsed = parseInput({
    schema: themeFormSchema,
    input,
    fallbackError: 'Data tema tidak valid',
  });
  if (!parsed.success) return parsed;

  return themeService.updateTheme(id, parsed.data);
}

export async function deleteTheme(id: string) {
  return themeService.deleteTheme(id);
}

export async function getActiveThemes() {
  return themeService.getActiveThemes();
}

// ──────── SubTheme actions ────────

export async function getSubThemes(params?: { themeId?: string }) {
  return themeService.getSubThemes(params);
}

export async function getSubTheme(id: string) {
  return themeService.getSubTheme(id);
}

export async function createSubTheme(input: Record<string, unknown>) {
  const parsed = parseInput({
    schema: subThemeFormSchema,
    input,
    fallbackError: 'Data sub tema tidak valid',
  });
  if (!parsed.success) return parsed;

  return themeService.createSubTheme(parsed.data);
}

export async function updateSubTheme(
  id: string,
  input: Record<string, unknown>
) {
  const parsed = parseInput({
    schema: subThemeFormSchema,
    input,
    fallbackError: 'Data sub tema tidak valid',
  });
  if (!parsed.success) return parsed;

  return themeService.updateSubTheme(id, parsed.data);
}

export async function deleteSubTheme(id: string) {
  return themeService.deleteSubTheme(id);
}

export async function getActiveSubThemes(params?: {
  themeId?: string;
  withTheme?: boolean;
}) {
  return themeService.getActiveSubThemes(params);
}
