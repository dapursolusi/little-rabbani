import { renderToBuffer } from '@react-pdf/renderer';

import type {
  IQuarterlySections,
  IQuarterlyStats,
} from '@/lib/actions/quarterly-report';

import { QuarterlyReportDocument } from './quarterly-report';

interface IGeneratePDFParams {
  kidName: string;
  termName: string;
  termPeriod: string;
  sections: IQuarterlySections;
  stats: IQuarterlyStats | null;
  previousTermName?: string;
}

const PDF_TIMEOUT_MS = 30_000;

/**
 * Generate a quarterly report PDF buffer using react-pdf.
 * Wraps renderToBuffer in a 30s timeout via Promise.race (VAL-MONTHLY-003 fix).
 * Returns the buffer on success, or null on failure (so caller can fallback).
 *
 * VAL-QUARTERLY-009: react-pdf render failure — fallback to plain HTML view.
 */
export async function generateQuarterlyPdf(
  params: IGeneratePDFParams
): Promise<Buffer | null> {
  try {
    const renderPromise = renderToBuffer(
      <QuarterlyReportDocument
        kidName={params.kidName}
        termName={params.termName}
        termPeriod={params.termPeriod}
        sections={params.sections}
        stats={params.stats}
        previousTermName={params.previousTermName}
      />
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('PDF generation timed out')),
        PDF_TIMEOUT_MS
      )
    );

    const buffer = await Promise.race([renderPromise, timeoutPromise]);
    return buffer;
  } catch (error) {
    console.error('react-pdf generation failed:', error);
    return null;
  }
}

/**
 * Format term period for display.
 */
export function formatTermPeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  const formatDate = (d: Date, locale = 'id-ID') =>
    d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return `${formatDate(start)} — ${formatDate(end)}`;
}
