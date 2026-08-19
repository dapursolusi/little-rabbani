import type * as React from 'react';
import type { ReactNode } from 'react';

// import { HTMLInputTypeAttribute } from 'react'; -- kept for reference: if React adds new input types, mirror them here

type FormFieldBase = {
  name: string;
  label?: string;
  className?: string;
  fullWidth?: boolean;
  placeholder?: string;
  required?: boolean;
  description?: string;
};

/**
 * A bare section header rendered as a `<fieldset>` + `<legend>`.
 * Fields listed AFTER a header in `form-fields.ts` belong to that section
 * until the next header. No `name`/`type` — it is never bound to a form value.
 * @see FormFieldGenerator — sequential grouping lives there.
 */
export type FormFieldGroupHeader = {
  groupLabel: string;
};

export type FormFieldInput = FormFieldBase & CustomHTMLInputType;

/**
 * One entry in a `FormField[]`. Either an input field (bound to a form value
 * via `name`) or a `{ groupLabel }` header that opens a labeled section for
 * every following input until the next header.
 */
export type FormField = FormFieldInput | FormFieldGroupHeader;

export type CustomHTMLInputType =
  | CustomHTMLInputTypeBasic
  | CustomHTMLInputTypeSelect
  | CustomHTMLInputTypeSwitch
  | CustomHTMLInputTypeCustom;

export type CustomHTMLInputTypeCustom = {
  type: 'custom';
  selectOptions?: never;
  render: (ctx: {
    field: {
      value: unknown;
      onChange: (value: unknown) => void;
      onBlur: () => void;
      name: string;
      ref: React.Ref<unknown>;
    };
    fieldState: { invalid: boolean };
  }) => ReactNode;
};

export type CustomHTMLInputTypeSelect = {
  type: 'select';
  selectOptions: SelectOption[];
};

export type SelectOption = { value: string; label: string } | SelectOptionGroup;

export interface SelectOptionGroup {
  group: string;
  options: { value: string; label: string }[];
}

export type CustomHTMLInputTypeSwitch = {
  type: 'switch';
  selectOptions?: never;
};

export type CustomHTMLInputTypeBasic = {
  type: StrictHTMLInputType;
  selectOptions?: never;
};

export type StrictHTMLInputType =
  | 'button'
  | 'checkbox'
  | 'hidden'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
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
