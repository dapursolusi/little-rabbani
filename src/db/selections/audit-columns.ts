import { DbTableAuditFields } from '@/types';

export const omitAuditColumns = {
  createdAt: false,
  updatedAt: false,
  deletedAt: false,
} as const satisfies Record<keyof DbTableAuditFields, boolean>;
