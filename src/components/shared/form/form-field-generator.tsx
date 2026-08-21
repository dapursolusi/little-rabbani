'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { type FormField, type FormFieldInput } from '@/types/field';
import { zodResolver } from '@hookform/resolvers/zod';
import { SaveIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { DefaultValues, FieldValues } from 'react-hook-form';
import { Controller, Path, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';

import InputFieldRenderer from './input-field-renderer';

export type DefaultFormFieldsProps<
  S extends z.ZodObject<z.ZodRawShape>,
  TForm extends FieldValues = S['_output'],
> = {
  schema: S;
  initialData: Record<string, unknown>;
  formFields: FormField[] | ((watch: (name: string) => unknown) => FormField[]);
  submitChildren?: ReactNode | ((ctx: { isSubmitting: boolean }) => ReactNode);
  meta?: { label: string };
  onSuccess?: () => void;
  onSubmit: (data: TForm) => unknown | Promise<unknown>;
  isEditing?: boolean;
};

export default function FormFieldGenerator<
  S extends z.ZodObject<z.ZodRawShape>,
  TForm extends FieldValues = S['_output'],
>({
  schema,
  initialData,
  formFields,
  onSubmit: onSubmitProp,
  submitChildren,
  meta,
  onSuccess,
  isEditing,
}: DefaultFormFieldsProps<S, TForm>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ponytail: casts at the zodResolver ↔ react-hook-form seams — variance on
  // optional/nullable mapped types makes TS reject structurally identical
  // types across these generics; known interop limitation, not unsoundness.
  const form = useForm<TForm>({
    resolver: zodResolver(schema) as never,
    defaultValues: initialData as DefaultValues<TForm>,
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset(initialData as TForm);
  }, [initialData, form]);

  const fields =
    typeof formFields === 'function'
      ? formFields((name) => form.watch(name as Path<TForm>))
      : formFields;

  // Sequential grouping: a `{ groupLabel }` header opens a labeled section
  // that every following field belongs to until the next header. Fields before
  // any header land in the unlabeled root block. Headers themselves are
  // dropped from the field list — they only carry the legend label.
  const groups = useMemo(() => {
    const groups: { groupLabel: string; fields: FormFieldInput[] }[] = [];
    let current = '';
    for (const field of fields) {
      if ('groupLabel' in field) {
        current = field.groupLabel;
        groups.push({ groupLabel: current, fields: [] });
        continue;
      }
      const last = groups.at(-1);
      if (last && last.groupLabel === current) {
        last.fields.push(field);
      } else {
        groups.push({ groupLabel: current, fields: [field] });
      }
    }
    return groups;
  }, [fields]);

  async function onSubmit(data: TForm): Promise<void> {
    if (typeof onSubmitProp !== 'function') {
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await onSubmitProp(data);
      if (!result) return;
      const r = result as { success: boolean; error?: string };
      if (r.success) {
        toast.success(
          `${meta?.label ?? 'Data'} berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}`
        );
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(r.error ?? 'Gagal menyimpan data');
      }
    } catch {
      toast.error(`${meta?.label ?? 'Data'} gagal disimpan`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderField(formField: FormFieldInput) {
    return (
      <Controller
        key={formField.name}
        name={formField.name as Path<TForm>}
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className={formField.fullWidth ? 'col-span-2' : ''}
          >
            {formField.type !== 'switch' && formField.label && (
              <FieldLabel htmlFor={formField.name}>
                {formField.label ?? 'Default Label'}
              </FieldLabel>
            )}
            <InputFieldRenderer
              fieldConfig={formField}
              field={field}
              fieldState={fieldState}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    );
  }

  return (
    // ponytail: RHF variance — SubmitHandler is contravariant, generic TForm
    // can't structurally satisfy it; the cast is the accepted resolver seam.
    <form
      onSubmit={form.handleSubmit(
        (data) => onSubmit(data as unknown as TForm),
        (errors) => {
          console.warn('[FormFieldGenerator] submit blocked by validation:', {
            formState: form.formState.errors,
            errors,
          });
        }
      )}
      className="w-full"
    >
      {groups.map(({ groupLabel, fields: groupFields }, index) => {
        // Space each group from the one above it; the very first group gets no
        // top margin. Index-based (not `first:`) so it works regardless of
        // whether the form starts with a labeled FieldSet or a root group.
        const groupSpacing = index === 0 ? '' : 'mt-6';
        return groupLabel ? (
          <FieldSet
            key={groupLabel}
            className={`sm:grid sm:grid-cols-2 ${groupSpacing}`}
          >
            <div className="sm:col-span-2! ">
              <FieldLegend className="text-xs! font-medium text-primary/80">
                {groupLabel}
              </FieldLegend>
              <FieldSeparator />
            </div>
            {groupFields.map(renderField)}
          </FieldSet>
        ) : (
          <div key="root" className={`${groupSpacing} flex flex-col gap-3`}>
            {groupFields.map(renderField)}
          </div>
        );
      })}
      {typeof submitChildren === 'function' ? (
        submitChildren({ isSubmitting })
      ) : submitChildren ? (
        submitChildren
      ) : (
        <Button
          disabled={isSubmitting}
          type="submit"
          className="w-full mt-8
          "
        >
          <HugeiconsIcon icon={SaveIcon} />
          Simpan
        </Button>
      )}
    </form>
  );
}
