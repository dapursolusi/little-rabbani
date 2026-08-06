import { getCurriculumPlanView } from '@/features/curriculum/actions';
import { getHolidays } from '@/features/holiday/actions';
import { getActiveSubThemes } from '@/features/theme/actions';

import SchoolCalendar from '@/components/sections/school-calendar';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Jadwal' };

export default async function CalendarPage() {
  const [planViewResult, holidaysResult, subThemesResult] = await Promise.all([
    getCurriculumPlanView(),
    getHolidays(),
    getActiveSubThemes({ withTheme: true }),
  ]);

  const planView = planViewResult.success ? planViewResult.data : null;
  const holidays = holidaysResult.success ? holidaysResult.data : [];
  const subThemes = subThemesResult.success ? subThemesResult.data : [];

  return (
    <SchoolCalendar
      planView={planView}
      holidays={holidays}
      subThemes={subThemes}
    />
  );
}
