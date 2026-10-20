import FormFieldGenerator from '@/components/shared/form/form-field-generator';

import { createSubTheme, createTheme } from '../actions';
import { subThemeFields, themeFields } from '../fields';
import type { Theme } from '../types';
import { subThemeSchema, themeSchema } from '../validation';

export function ThemeForm({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <FormFieldGenerator
      schema={themeSchema}
      formFields={themeFields}
      initialData={{
        name: '',
      }}
      onSubmitAction={async (data) => {
        return createTheme(data);
      }}
      onSuccessAction={onSuccess}
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
      onSubmitAction={async (data) => {
        return createSubTheme(data);
      }}
      onSuccessAction={onSuccess}
    />
  );
}
