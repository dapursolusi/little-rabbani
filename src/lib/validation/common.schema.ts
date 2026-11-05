import z from 'zod';

export const uuidSchema = z.uuid('Invalid id format, must adhere UUID');
export type UUID = z.infer<typeof uuidSchema>;

export const isoDateSchema = z.iso.date(
  'Invalid date format, use "YYYY-MM-DD"'
);
export type ISODate = z.infer<typeof isoDateSchema>;

export const isoYearMonthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Invalid ISO format, use "YYYY-MM"');
export type ISOYearMonth = z.infer<typeof isoYearMonthSchema>;
