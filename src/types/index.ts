import { ExtractTablesWithRelations } from 'drizzle-orm';
import { NeonQueryResultHKT } from 'drizzle-orm/neon-serverless';
import { PgTransaction } from 'drizzle-orm/pg-core';

export interface BaseDTOResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface SelectOptions {
  value: string;
  label: string;
}

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type SearchParams = {
  search?: string;
};

export type ListParams = PaginationParams & SearchParams;

export type TransactionClient = PgTransaction<
  NeonQueryResultHKT,
  typeof import('@/db/schema'),
  ExtractTablesWithRelations<typeof import('@/db/schema')>
>;
