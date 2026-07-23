'use client';

import { useEffect, useState } from 'react';

import { scheduledActivityFields } from '@/features/schedule/fields';
import { getSessionTypes } from '@/features/sessionType/actions';
import { SessionType } from '@/features/sessionType/types';
import { getSubThemes } from '@/features/theme/actions';
import { SubTheme } from '@/features/theme/types';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

export default function CreateSchedulePage() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [sessionsRes, subThemesRes] = await Promise.all([
        getSessionTypes(),
        getSubThemes(),
      ]);
      if (sessionsRes.success) setSessions(sessionsRes.data);
      if (subThemesRes.success) setSubThemes(subThemesRes.data);
    };

    fetchData();
  }, []);
  return (
    <div className="w-full mx-auto max-w-[600]">
      <DefaultFormFields
        formFields={(watch) =>
          scheduledActivityFields({
            isMultipleDays: watch('isMultipleDays') as boolean,
            sessions,
            subThemes,
          })
        }
        schemaKey="scheduledActivity"
        initialData={{
          name: '',
          isMultipleDays: false,
          startDate: '',
          endDate: '',
          subThemeId: '',
          sessionTypeId: '',
          indoor: false,
          location: '',
          itemsToBring: '',
          permissionRequired: '',
        }}
        onSubmit={async (data) => {
          const payload = { ...data };
          if (!payload.isMultipleDays) {
            payload.endDate = payload.startDate;
          }
          console.log(payload);
        }}
      >
        <Button type="submit" className="w-full">
          Simpan
        </Button>
      </DefaultFormFields>
    </div>
  );
}
