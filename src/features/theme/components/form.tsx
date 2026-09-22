import FormFieldGenerator from '@/components/shared/form/form-field-generator';

import { createSubTheme, createTheme } from '../actions';
import { subThemeFields, themeFields } from '../fields';
import { subThemeSchema, themeSchema } from '../schema';
import type { Theme } from '../types';

export function ThemeForm({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <FormFieldGenerator
      schema={themeSchema}
      formFields={themeFields}
      initialData={{
        name: '',
      }}
      onSuccess={onSuccess}
      onSubmit={async (data) => {
        return createTheme(data);
      }}
    />
  );
}

export function SubThemeForm({
  themes,
  onSuccess,
}: {
  themes: Theme[];
  onSuccess?: () => void;
}) {
  return (
    <FormFieldGenerator
      schema={subThemeSchema}
      formFields={subThemeFields(themes)}
      initialData={{
        name: '',
        themeId: '',
      }}
      onSuccess={onSuccess}
      onSubmit={async (data) => {
        return createSubTheme(data);
      }}
    />
  );
}
