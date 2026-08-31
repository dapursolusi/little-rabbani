import { BaseDTOResponse } from '@/types';

import { GuardianInput, UpdateKidInput } from './schema';

// ponytail: lean subset of Kid (id, name) for guardian kids badges — not full Kid objects
export interface LeanKid {
  id: string;
  name: string;
}

export interface Guardian extends GuardianInput, BaseDTOResponse {
  kids?: LeanKid[];
}

export interface Kid extends UpdateKidInput, BaseDTOResponse {
  guardian: Guardian;
}
