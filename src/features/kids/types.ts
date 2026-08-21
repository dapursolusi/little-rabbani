import { BaseDTOResponse } from '@/types';

import { CreateGuardianInput, UpdateKidInput } from './schemas';

// ponytail: lean subset of Kid (id, name) for guardian kids badges — not full Kid objects
export interface LeanKid {
  id: string;
  name: string;
}

export interface Guardian extends CreateGuardianInput, BaseDTOResponse {
  kids?: LeanKid[];
}

export interface Kid extends UpdateKidInput, BaseDTOResponse {
  guardian: Guardian;
}
