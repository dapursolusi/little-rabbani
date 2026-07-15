import { BaseDataResponse } from '@/types';

import { Kid } from '../kid/types';
import { GuardianFormData } from './schema';

// ponytail: kids is a lean subset (id, name, status) from getGuardians,
// not full Kid objects with guardian/enrolledTerm populated.
type LeanKid = Pick<Kid, 'id' | 'name' | 'status'>;

export interface Guardian extends BaseDataResponse, GuardianFormData {
  kids?: LeanKid[];
}
