'use server';

import { headers } from 'next/headers';

import * as kidReportService from '@/features/report/kid/services';
import { ActionResult } from '@/types';
import { z } from 'zod';

import { handleActionError } from '@/lib/action/action-error';
import { parseInput } from '@/lib/action/parse-input';
import { auth } from '@/lib/auth';
import { isoYearMonthSchema, uuidSchema } from '@/lib/validation/common.schema';

import { MonthlyKidReportParams } from '../types';

const generateInputSchema = z.object({
  kidId: uuidSchema,
  termId: uuidSchema,
  yearMonth: isoYearMonthSchema,
});

const saveInputSchema = generateInputSchema.extend({
  narrative: z.string().min(1, 'Narasi tidak boleh kosong'),
});

/**
 * Server-side authorization for every monthly-report mutation. Server Actions
 * are directly callable, so the proxy's route guard is not enough on its own.
 * Reports are owner-only (mirrors ROLE_ROUTES in proxy.ts). The session's user
 * id is also the trusted source for `sentBy`.
 */
async function requireReportEditor(): Promise<ActionResult<string>> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      success: false as const,
      message: 'Anda harus masuk untuk mengubah laporan',
    };
  }

  if (session.user.role !== 'owner') {
    return {
      success: false as const,
      message: 'Akses ditolak. Hanya Owner yang dapat mengubah laporan.',
    };
  }

  return { success: true as const, data: session.user.id };
}

export async function generateMonthlyReport(input: MonthlyKidReportParams) {
  const session = await requireReportEditor();
  if (!session.success) return session;

  try {
    const parsed = parseInput({ input, schema: generateInputSchema });
    if (!parsed.success) return parsed;

    const reportDraft = await kidReportService.generateMonthlyReport(
      parsed.data
    );
    return {
      success: true as const,
      data: reportDraft,
      message: 'Berhasil membuat laporan dengan AI',
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function saveMonthlyReportNarrative(
  input: MonthlyKidReportParams & { narrative: string }
) {
  const session = await requireReportEditor();
  if (!session.success) return session;

  try {
    const parsed = parseInput({ input, schema: saveInputSchema });
    if (!parsed.success) return parsed;

    const report = await kidReportService.saveMonthlyReportNarrative(
      parsed.data
    );
    return {
      success: true as const,
      data: report,
      // A no-op save (content unchanged) must not claim a save happened.
      message: report.isEdited
        ? 'Laporan berhasil disimpan'
        : 'Tidak ada perubahan untuk disimpan',
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function reviewMonthlyReport(input: MonthlyKidReportParams) {
  const session = await requireReportEditor();
  if (!session.success) return session;

  try {
    const parsed = parseInput({ input, schema: generateInputSchema });
    if (!parsed.success) return parsed;

    const report = await kidReportService.markMonthlyReportReviewed(
      parsed.data
    );
    return {
      success: true as const,
      data: report,
      message: 'Laporan ditandai sudah direview',
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function sendMonthlyReport(input: MonthlyKidReportParams) {
  const session = await requireReportEditor();
  if (!session.success) return session;

  try {
    const parsed = parseInput({ input, schema: generateInputSchema });
    if (!parsed.success) return parsed;

    const report = await kidReportService.markMonthlyReportSent({
      ...parsed.data,
      // Never trust a client-supplied sender id.
      sentBy: session.data,
    });
    return {
      success: true as const,
      data: report,
      message: 'Laporan berhasil dikirim',
    };
  } catch (error) {
    return handleActionError(error);
  }
}
