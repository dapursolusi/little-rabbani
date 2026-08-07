'use client';

import { createCalendarEvent } from '@/features/calendar/actions';
import { calendarEventFields } from '@/features/calendar/fields';
import { useCalendarFormData } from '@/features/calendar/hooks';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

export default function CreateCalendarEventPage() {
  const { sessions, subThemes } = useCalendarFormData();
  return (
    <div className="w-full mx-auto max-w-[600]">
      <DefaultFormFields
        formFields={(watch) =>
          calendarEventFields({
            isMultipleDays: watch('isMultipleDays') as boolean,
            sessions,
            subThemes,
            indoor: watch('indoor') as boolean,
          })
        }
        schemaKey="calendarEvent"
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
          // ponytail: pass action schema fields only (subThemeId differs: uuid|'' vs strict uuid)
          return createCalendarEvent(data);
        }}
        onSuccess={() => {
          window.location.href = '/dashboard/owner/calendar';
        }}
      >
        <Button type="submit" className="w-full">
          Simpan
        </Button>
      </DefaultFormFields>
    </div>
  );
}
