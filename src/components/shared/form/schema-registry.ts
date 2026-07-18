import { GuardianFormSchema } from '@/features/guardian/schema';
import { KidFormSchema } from '@/features/kid/schema';
import z from 'zod';

const schemas = {
  kid: KidFormSchema,
  guardian: GuardianFormSchema,
} as const satisfies Record<string, z.ZodObject<z.ZodRawShape>>;

export type SchemaKey = keyof typeof schemas;

export function getZodSchema<K extends SchemaKey>(key: K): (typeof schemas)[K] {
  const schema = schemas[key];
  if (!schema) throw new Error(`Schema not found: ${key}`);
  return schema;
}
