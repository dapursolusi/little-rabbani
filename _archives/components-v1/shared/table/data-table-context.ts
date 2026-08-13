'use client';

import { createContext } from 'react';

import type { FormField } from '@/types/field';

import type { SchemaKey } from '../form/schema-registry';

export const EditFormContext = createContext<{
  schemaKey?: SchemaKey;
  formFields: FormField[];
}>({ schemaKey: undefined, formFields: [] });
