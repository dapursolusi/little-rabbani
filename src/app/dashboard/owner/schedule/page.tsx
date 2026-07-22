import { getHolidays } from '@/features/holiday/actions';

import SchoolCalendar from '@/components/sections/school-calendar';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Jadwal' };

export default async function ScheduleSelectorPage() {
  const holidayResult = await getHolidays();

  if (!holidayResult.success) {
    return (
      <div className="p-4 text-center text-destructive">
        {holidayResult.error}
      </div>
    );
  }

  return <SchoolCalendar holidays={holidayResult.data} />;
}
