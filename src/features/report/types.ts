import { MonthlyReportStatus } from './constants';

export interface MonthlyKidReportParams {
  termId: string;
  kidId: string;
  yearMonth: string;
}

// ============================================
// CLASS OVERVIEW (readiness + lifecycle, side by side)
// ============================================

/** One enrolled child's reporting situation for the selected class/month. */
export interface ClassReportKid {
  kidId: string;
  name: string;
  nickName: string | null;
  classSessionId: string;
  /** Enough observations for the existing generation eligibility checks. */
  ready: boolean;
  /** Why the child is not ready — only set when `ready` is false. */
  readinessReason?: string;
  /** Persisted lifecycle status, or null when no report exists yet. */
  reportStatus: MonthlyReportStatus | null;
  /** Teacher saved manual changes — independent of the lifecycle status. */
  isEdited: boolean;
}

export interface ClassReportSummary {
  totalKids: number;
  /** Children with an existing report, whatever its lifecycle status. */
  withReport: number;
  /** Ready children with no report — what a batch generation would produce. */
  eligibleWithoutReport: number;
  /** Not-ready children with no report. */
  insufficientWithoutReport: number;
}

export interface ClassReportOverview {
  kids: ClassReportKid[];
  summary: ClassReportSummary;
  /** Term final month — monthly reports do not apply (termly does). */
  isFinalMonth: boolean;
  /** Observation window: calendar month clipped to the term. */
  monthStart: string;
  monthEnd: string;
}

export interface ClassReportOverviewParams {
  termId: string;
  /** Class session id, or 'all'/undefined for every class in the term. */
  classSessionId?: string;
  yearMonth: string;
}
