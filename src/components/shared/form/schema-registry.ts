import { calendarEventSchema } from '@/features/calendar/schema';
import { GuardianFormSchema } from '@/features/guardian/schema';
import { HolidayFormSchema } from '@/features/holiday/schema';
import { KidFormSchema } from '@/features/kid/schema';
import { SessionTypeFormSchema } from '@/features/sessionType/schema';
import { TermFormSchema } from '@/features/term/schema';
import { ThemeFormSchema } from '@/features/theme/schema';
import z from 'zod';

const schemas = {
  kid: KidFormSchema,
  guardian: GuardianFormSchema,
  term: TermFormSchema,
  sessionType: SessionTypeFormSchema,
  holiday: HolidayFormSchema,
  theme: ThemeFormSchema,
  calendarEvent: calendarEventSchema,
} as const satisfies Record<string, z.ZodObject<z.ZodRawShape>>;

export type SchemaKey = keyof typeof schemas;

export function getZodSchema<K extends SchemaKey>(key: K): (typeof schemas)[K] {
  const schema = schemas[key];
  if (!schema) throw new Error(`Schema not found: ${key}`);
  return schema;
}
