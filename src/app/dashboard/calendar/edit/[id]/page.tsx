'use client';

import { updateCalendarEvent } from '@/features/calendar/actions';
import { calendarEventFields } from '@/features/calendar/fields';
import { useCalendarFormData } from '@/features/calendar/hooks';
import type { CalendarEventFormData } from '@/features/calendar/types';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Button } from '@/components/ui/button';

export default function EditCalendarEventPage() {
  const { eventId, event, sessions, subThemes } = useCalendarFormData();

  if (!event)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat data...
      </div>
    );

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
          name: event?.name ?? '',
          isMultipleDays: event?.isMultipleDays ?? false,
          startDate: event?.startDate ?? '',
          endDate: event?.endDate ?? '',
          subThemeId: event?.subThemeId ?? '',
          sessionTypeId: event?.sessionTypeId ?? '',
          indoor: event?.indoor ?? false,
          location: event?.location ?? '',
          itemsToBring: event?.itemsToBring ?? '',
          permissionRequired: event?.permissionRequired ?? false,
        }}
        isEditing
        onSubmit={async (data) =>
          updateCalendarEvent(eventId, data as CalendarEventFormData)
        }
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
