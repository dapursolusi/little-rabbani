import * as classSessionService from '@/features/class-session/services';
import { reportTemplateAction } from '@/features/daily-class-report/actions';
import DailyClassReportClient from '@/features/daily-class-report/components/client';
import { dcrService } from '@/features/daily-class-report/services';
import * as kidEnrollmentService from '@/features/kid-enrollment/services';
import * as themeService from '@/features/theme/services';
import { getLocalDateString } from '@/utils/date';

export default async function DailyClassReportPage({
  searchParams,
}: {
  searchParams: Promise<{ classSessionId?: string }>;
}) {
  const { classSessionId } = await searchParams;
  const todayDate = getLocalDateString();

  const [
    classSessions,
    themes,
    enrolledKids,
    existingDCRs,
    defaultReportTemplate,
  ] = await Promise.all([
    classSessionService.getClassSessions(),
    themeService.getThemes(),
    kidEnrollmentService.getCurrentTermEnrolledKidsByClassSession(
      classSessionId ?? ''
    ),
    dcrService.getDCRs({
      date: { year: Number(todayDate.slice(0, 4)) },
      classSessionId,
    }),
    reportTemplateAction.getDefaultTemplate(),
  ]);

  return (
    <DailyClassReportClient
      classSessions={classSessions}
      themes={themes.items}
      enrolledKids={enrolledKids}
      defaultClassSessionId={classSessionId}
      existingDCRs={existingDCRs}
      defaultReportTemplate={defaultReportTemplate.content ?? ''}
    />
  );
}
