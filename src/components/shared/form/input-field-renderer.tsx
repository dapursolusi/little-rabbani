import { type FormFieldInput, type SelectOptionGroup } from '@/types/field';
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

interface InputFieldRendererProps<TFormAttributes extends FieldValues> {
  fieldConfig: FormFieldInput;
  field: ControllerRenderProps<TFormAttributes, Path<TFormAttributes>>;
  fieldState: ControllerFieldState;
}

export default function InputFieldRenderer<
  TFormAttributes extends FieldValues,
>({
  fieldConfig,
  field,
  fieldState,
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
          onValueChange={field.onChange}
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
                    {group.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
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

    case 'switch':
      return (
        <div className="flex gap-2 items-center">
          <Switch
            id="switch-options"
            size="sm"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          <FieldLabel htmlFor="switch-options">{fieldConfig.label}</FieldLabel>
        </div>
      );

    case 'hidden':
      return null;

    default:
      return (
        <Input
          {...field}
          id={field.name}
          type={fieldConfig.type}
          aria-invalid={fieldState.invalid}
          placeholder={fieldConfig.placeholder ?? 'Enter value'}
          autoComplete="off"
          value={field.value as string | number | readonly string[] | undefined}
        />
      );
  }
}
