import { BaseDataResponse } from '@/types';

import { Kid } from '../kid/types';

// ponytail: kids is a lean subset (id, name, status) from getGuardians,
// not full Kid objects with guardian/enrolledTerm populated.
type LeanKid = Pick<Kid, 'id' | 'name' | 'status'>;

export interface Guardian extends BaseDataResponse {
  name: string;
  email: string | null;
  phone: string;
  secondContactName: string | null;
  secondContactPhone: string | null;
  kids?: LeanKid[];
}
