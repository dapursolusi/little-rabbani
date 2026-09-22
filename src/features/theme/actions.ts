'use server';

import { parseInput } from '@/lib/actions/parse-input';
import { requireOwner } from '@/lib/actions/require-owner';

import { subThemeFormSchema, themeFormSchema } from './schema';
import * as themeService from './services';

export async function getThemes(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return requireOwner(async () => {
    return themeService.getThemes(params);
  });
}

export async function getTheme(id: string) {
  return requireOwner(async () => {
    return themeService.getTheme(id);
  });
}

export async function createTheme(input: Record<string, unknown>) {
  const parsed = parseInput({
    schema: themeFormSchema,
    input,
    fallbackError: 'Data tema tidak valid',
  });
  if (!parsed.success) return parsed;

  return requireOwner(async () => {
    return themeService.createTheme(parsed.data);
  });
}

export async function updateTheme(id: string, input: Record<string, unknown>) {
  const parsed = parseInput({
    schema: themeFormSchema,
    input,
    fallbackError: 'Data tema tidak valid',
  });
  if (!parsed.success) return parsed;

  return requireOwner(async () => {
    return themeService.updateTheme(id, parsed.data);
  });
}

export async function deleteTheme(id: string) {
  return requireOwner(async () => {
    return themeService.deleteTheme(id);
  });
}

export async function getActiveThemes() {
  return requireOwner(async () => {
    return themeService.getActiveThemes();
  });
}

// ──────── SubTheme actions ────────

export async function getSubThemes(params?: { themeId?: string }) {
  return requireOwner(async () => {
    return themeService.getSubThemes(params);
  });
}

export async function getSubTheme(id: string) {
  return requireOwner(async () => {
    return themeService.getSubTheme(id);
  });
}

export async function createSubTheme(input: Record<string, unknown>) {
  const parsed = parseInput({
    schema: subThemeFormSchema,
    input,
    fallbackError: 'Data sub tema tidak valid',
  });
  if (!parsed.success) return parsed;

  return requireOwner(async () => {
    return themeService.createSubTheme(parsed.data);
  });
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

  return requireOwner(async () => {
    return themeService.updateSubTheme(id, parsed.data);
  });
}

export async function deleteSubTheme(id: string) {
  return requireOwner(async () => {
    return themeService.deleteSubTheme(id);
  });
}

export async function getActiveSubThemes(params?: {
  themeId?: string;
  withTheme?: boolean;
}) {
  return requireOwner(async () => {
    return themeService.getActiveSubThemes(params);
  });
}
