import { FormField } from '@/types/field';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, Path, useForm } from 'react-hook-form';
import z from 'zod';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

import InputFieldRenderer from './input-field-renderer';
import { type SchemaKey, getZodSchema } from './schema-registry';

export interface CreateUpdateFormProps {
  schemaKey?: SchemaKey;
  initialData: Record<string, unknown>;
  formFields: FormField[];
}

export default function DefaultFormFields({
  schemaKey,
  initialData,
  formFields,
}: CreateUpdateFormProps) {
  const schema = schemaKey ? getZodSchema(schemaKey) : z.object({});
  type TForm = z.output<typeof schema>;

  // ponytail: single cast at the zodResolver ↔ react-hook-form library seam.
  // Variance on optional/nullable mapped types makes TS reject the structurally
  // identical Resolver — this is a known interop limitation, not unsoundness.
  const form = useForm<TForm>({
    resolver: zodResolver(schema) as never,
    defaultValues: initialData as TForm,
    mode: 'onChange',
  });

  function onSubmit(data: z.output<typeof schema>) {
    console.warn(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {formFields.map((formField) => (
        <Controller
          key={formField.name}
          name={formField.name as Path<TForm>}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={formField.name}>
                {formField.label ?? 'Default Label'}
              </FieldLabel>
              <InputFieldRenderer
                fieldConfig={formField}
                field={field}
                fieldState={fieldState}
              />
              <FieldDescription></FieldDescription>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        ></Controller>
      ))}
    </form>
  );
}
