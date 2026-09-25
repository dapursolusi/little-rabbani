import * as classSessionAction from '@/features/class-session/actions';
import {
  dcrAction,
  observationAction,
} from '@/features/daily-class-report/actions';
import DailyClassReportClient from '@/features/daily-class-report/components/dcr-client';
import { DCRObservation } from '@/features/daily-class-report/types';
import * as kidEnrollmentAction from '@/features/kid-enrollment/actions';
import * as termAction from '@/features/term/actions';
import * as themeAction from '@/features/theme/actions';

export default async function DailyClassReportPage({
  searchParams,
}: {
  searchParams: Promise<{ classSessionId?: string }>;
}) {
  const { classSessionId } = await searchParams;

  const [csResults, themeResults, currentTermResults] = await Promise.all([
    classSessionAction.getClassSessions(),
    themeAction.getThemes(),
    termAction.checkCurrentTerm(),
  ]);

  if (
    !csResults.success ||
    !themeResults.success ||
    !currentTermResults.success
  ) {
    return (
      <section className="p-4 text-center text-destructive">
        {!csResults.success && csResults.error}
        {!themeResults.success && themeResults.error}
        {!currentTermResults.success && currentTermResults.error}
      </section>
    );
  }
  const currentKids =
    await kidEnrollmentAction.getCurrentTermKidEnrollmentsByClassSession({
      classSessionId,
    });
  const currentDCR = await dcrAction.getOrCreateDCR({
    classSessionId: classSessionId as string,
  });
  const existingObservations =
    await observationAction.getDCRObservationsByDcrId(
      currentDCR.data?.id as string
    );
  return (
    <DailyClassReportClient
      classSessions={csResults.data}
      themes={themeResults.data}
      kids={currentKids.data?.map((ck) => ck.kid) ?? []}
      defaultClassSessionId={classSessionId}
      existingObservations={existingObservations.data as DCRObservation[]}
    />
  );
}
