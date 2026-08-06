import { getCurriculumPlanView } from '@/features/curriculum/actions';
import { getHolidays } from '@/features/holiday/actions';

import SchoolCalendar from '@/components/sections/school-calendar';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Jadwal' };

export default async function CalendarPage() {
  const [planViewResult, holidaysResult] = await Promise.all([
    getCurriculumPlanView(),
    getHolidays(),
  ]);

  const planView = planViewResult.success ? planViewResult.data : null;
  const holidays = holidaysResult.success ? holidaysResult.data : [];

  return <SchoolCalendar planView={planView} holidays={holidays} />;
}
