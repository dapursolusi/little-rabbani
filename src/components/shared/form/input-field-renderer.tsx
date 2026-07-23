import { type FormField } from '@/types/field';
import {
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface InputFieldRendererProps<TFormAttributes extends FieldValues> {
  fieldConfig: FormField;
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
    case 'select':
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
              {
                fieldConfig.selectOptions.find(
                  (opt) => opt.value === field.value
                )?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="center">
            {fieldConfig.selectOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

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
