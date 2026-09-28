import z from 'zod';

export const uuidSchema = z.uuid();
export type UUID = z.infer<typeof uuidSchema>;

export const isoDateSchema = z.iso.date();
export type ISODate = z.infer<typeof isoDateSchema>;
