'use server';

import { parseInput } from '@/lib/actions/parse-input';

import { CreateKidSchema, GuardianSchema, UpdateKidSchema } from './schema';
import * as kidService from './services';
import { LeanKid } from './types';

// ── Reads ─────────────────────────────────────────────

export async function getKids(searchParams?: URLSearchParams) {
  const search = searchParams?.get('search') ?? undefined;
  const limit = Number(searchParams?.get('limit') ?? 50);
  const offset = Number(searchParams?.get('offset') ?? 0);

  return await kidService.getKids({ limit, offset, search });
}

export async function getKid(id: string) {
  return kidService.getKid(id);
}

// ── Mutations ─────────────────────────────────────────

export async function createKid(input: {
  kid: unknown;
  guardian?: unknown;
  guardianId?: string;
}) {
  const parsedKid = parseInput(
    CreateKidSchema,
    input.kid,
    'Data anak tidak valid'
  );
  if (!parsedKid.success) return parsedKid;
  const kidData = parsedKid.data;

  const parsedGuardian = parseInput(
    GuardianSchema,
    input.guardian,
    'Data wali tidak valid'
  );
  if (!parsedGuardian.success) return parsedGuardian;
  const guardianData = parsedGuardian.data;

  return await kidService.createKid({
    kid: kidData,
    guardian: guardianData,
    guardianId: input.guardianId,
  });
}

export async function updateKid(
  kidId: string,
  input: {
    kid: unknown;
    guardian?: unknown;
    guardianId?: string;
  }
) {
  const parsedKid = parseInput(
    UpdateKidSchema,
    input.kid,
    'Data anak tidak valid'
  );
  if (!parsedKid.success) return parsedKid;
  const kidData = parsedKid.data;

  const parsedGuardian = parseInput(
    GuardianSchema,
    input.guardian,
    'Data wali tidak valid'
  );
  if (!parsedGuardian.success) return parsedGuardian;
  const guardianData = parsedGuardian.data;

  return await kidService.updateKid(kidId, {
    kid: kidData,
    guardian: guardianData,
    guardianId: input.guardianId,
  });
}

export async function deleteKid(id: string) {
  return await kidService.deleteKid(id);
}

export interface GuardianSearchResult {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  secondContactName: string | null;
  secondContactPhone: string | null;
  kids: LeanKid[];
}

export async function searchGuardians(search: string) {
  return await kidService.searchGuardians(search);
}
