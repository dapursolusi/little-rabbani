// import { HTMLInputTypeAttribute } from 'react'; -- kept for reference: if React adds new input types, mirror them here

type FormFieldBase = {
  name: string;
  label: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
};

export type FormField = FormFieldBase & CustomHTMLInputType;

export type CustomHTMLInputType =
  CustomHTMLInputTypeBasic | CustomHTMLInputTypeSelect;

export type CustomHTMLInputTypeSelect = {
  type: 'select';
  selectOptions: { value: string; label: string }[];
};

export type CustomHTMLInputTypeBasic = {
  type: StrictHTMLInputType;
  selectOptions?: never;
};

export type StrictHTMLInputType =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week';
