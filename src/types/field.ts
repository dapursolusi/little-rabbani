import { HTMLInputTypeAttribute } from 'react';

export interface FormField {
  name: string;
  label: string;
  type: CustomHTMLInputType;
  className?: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
}

export type CustomHTMLInputType = 'select' | StrictHTMLInputType;

export type StrictHTMLInputType = HTMLInputTypeAttribute extends infer T
  ? T extends string
    ? string extends T
      ? never
      : T
    : never
  : never;
