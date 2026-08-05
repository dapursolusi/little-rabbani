import SchoolCalendar from '@/components/sections/school-calendar';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Jadwal' };

export default async function CalendarPage() {
  return <SchoolCalendar />;
}
