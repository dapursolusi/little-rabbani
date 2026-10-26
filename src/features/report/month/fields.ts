import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { FormField } from '@/types/field';
import { pushParam } from '@/utils/search-params';

import {
  classSessionIdField,
  termIdField,
} from '@/components/shared/form/fields';

import { ClassSession } from '../../class-session/types';
import { Term } from '../../term/types';

export const monthlyReportFormFields = ({
  terms,
  classSessions,
  router,
}: {
  terms: Term[];
  classSessions: ClassSession[];
  router: AppRouterInstance;
}): FormField[] => [
  termIdField({
    terms,
    onValueChangeAction: (val) =>
      pushParam({ key: 'termId', value: val, router }),
  }),
  classSessionIdField({
    classSessions,
    onValueChangeAction: (val) =>
      pushParam({ key: 'classSessionId', value: val, router }),
  }),
];
