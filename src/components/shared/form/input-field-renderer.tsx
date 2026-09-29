import {
  type CustomHTMLInputTypeSelect,
  type FormFieldInput,
  type SelectOptionGroup,
} from '@/types/field';
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
} from 'react-hook-form';

import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface InputFieldRendererProps<TFormAttributes extends FieldValues> {
  fieldConfig: FormFieldInput;
  field: ControllerRenderProps<TFormAttributes, Path<TFormAttributes>>;
  fieldState: ControllerFieldState;
  disabled?: boolean;
}

export default function InputFieldRenderer<
  TFormAttributes extends FieldValues,
>({
  fieldConfig,
  field,
  fieldState,
  disabled,
}: InputFieldRendererProps<TFormAttributes>) {
  switch (fieldConfig.type) {
    case 'select': {
      const options = fieldConfig.selectOptions;
      const grouped = options?.length ? 'group' in (options[0] ?? {}) : false;
      const flatOpts = (grouped ? [] : options) as {
        value: string;
        label: string;
      }[];
      const selectedLabel = grouped
        ? (options as SelectOptionGroup[])
            .flatMap((g) => g.options)
            .find((opt) => opt.value === field.value)?.label
        : flatOpts.find((opt) => opt.value === field.value)?.label;

      return (
        <Select
          name={field.name}
          value={field.value}
          disabled={disabled}
          onValueChange={(value) => {
            field.onChange(value);
            (fieldConfig as CustomHTMLInputTypeSelect).onValueChange?.(
              (value as unknown as string) ?? ''
            );
          }}
        >
          <SelectTrigger
            id={field.name}
            aria-invalid={fieldState.invalid}
            className="min-w-30"
          >
            <SelectValue placeholder={fieldConfig.placeholder ?? 'Select'}>
              {selectedLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="center">
            {grouped
              ? (options as SelectOptionGroup[]).map((group) => (
                  <SelectGroup key={group.group}>
                    <SelectLabel>{group.group}</SelectLabel>
                    {group.options.length > 0 ? (
                      group.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled>—</SelectItem>
                    )}
                  </SelectGroup>
                ))
              : flatOpts.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
      );
    }

    case 'custom': {
      return fieldConfig.render({
        field: {
          value: field.value,
          onChange: field.onChange,
          onBlur: field.onBlur,
          name: field.name,
          ref: field.ref,
        },
        fieldState: { invalid: fieldState.invalid },
      });
    }

    case 'switch':
      return (
        <div className="flex gap-2 items-center">
          <Switch
            id="switch-options"
            size="sm"
            checked={field.value}
            disabled={disabled}
            onCheckedChange={field.onChange}
          />
          <FieldLabel
            htmlFor="switch-options"
            className={`${typeof fieldConfig.label === 'object' ? fieldConfig.label.className : ''}`}
          >
            {typeof fieldConfig.label === 'string'
              ? fieldConfig.label
              : fieldConfig.label?.text}
          </FieldLabel>
        </div>
      );

    case 'toggle-group':
      // ponytail: base-ui ToggleGroup is array-based (Value[]) even in
      // single-select mode, but RHF field.value is a string from zod enum.
      // Wrap/unwrap the single value at this seam.
      const items = fieldConfig.items;
      const toggleValue = field.value ? [field.value] : [];
      return (
        <ToggleGroup
          value={toggleValue}
          onValueChange={(val) => field.onChange(val.at(0) ?? undefined)}
          disabled={disabled}
          className="w-full grid grid-cols-2 sm:grid-cols-4 items-stretch"
        >
          {items.map((item) => (
            <ToggleGroupItem
              variant="outline"
              key={item.value}
              value={item.value}
              className="flex justify-center px-1"
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );

    case 'hidden':
      return null;

    case 'textarea':
      return (
        <Textarea
          {...field}
          id={field.name}
          aria-invalid={fieldState.invalid}
          placeholder={fieldConfig.placeholder ?? 'Enter value'}
          autoComplete="off"
          disabled={disabled}
          value={field.value as string | number | readonly string[] | undefined}
        />
      );

    default:
      return (
        <Input
          {...field}
          id={field.name}
          type={fieldConfig.type}
          aria-invalid={fieldState.invalid}
          placeholder={fieldConfig.placeholder ?? 'Enter value'}
          autoComplete="off"
          disabled={disabled}
          value={field.value as string | number | readonly string[] | undefined}
        />
      );
  }
}
