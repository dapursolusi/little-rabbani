'use client';

import { useEffect, useState } from 'react';

import { scheduleItemTypeEnum } from '@/db/schema';
import { scheduledActivityFields } from '@/features/schedule/fields';
import { getSessionTypes } from '@/features/sessionType/actions';
import { SessionType } from '@/features/sessionType/types';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

export default function CreateSchedulePage() {
  const [sessions, setSessions] = useState<SessionType[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      const response = await getSessionTypes();
      if (response.success) {
        setSessions(response.data);
      }
    };

    fetchSessions();
  }, []);
  return (
    <div className="w-full mx-auto max-w-[600]">
      <DefaultFormFields
        formFields={(watch) =>
          scheduledActivityFields({
            isMultipleDays: watch('isMultipleDays') as boolean,
            sessions,
          })
        }
        schemaKey="scheduledActivity"
        initialData={{
          name: '',
          isMultipleDays: false,
          startDate: '',
          endDate: '',
          cateogory: '',
          sessionTypeId: '',
          type: scheduleItemTypeEnum.enumValues[1],
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
