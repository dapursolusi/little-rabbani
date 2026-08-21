import { BaseDTOResponse } from '@/types';

import { TermInput } from './schema';

export interface Term extends BaseDTOResponse, TermInput {}
