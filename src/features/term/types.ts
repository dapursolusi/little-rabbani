import { term } from '@/db/schema';
import { BaseDTOResponse, DbTableAuditFields } from '@/types';

import { Kid } from '../kid/types';
import { TermInput } from './validation';

export interface Term extends BaseDTOResponse, TermInput {
  isAutoCreated: boolean;
}

export interface TermWithEnrollments extends Term {
  kids: Kid[];
}

export type TermRecord = typeof term.$inferSelect;
export type TermData = Omit<TermRecord, keyof DbTableAuditFields>;
