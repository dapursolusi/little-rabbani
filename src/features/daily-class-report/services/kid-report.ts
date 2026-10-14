import * as themeService from '@/features/theme/services';
import { ActionResult } from '@/types';
import {
  DailyReportTemplateRenderData,
  TemplateData,
  renderDailyReportTemplate,
  renderTemplate,
} from '@/utils/template';

import { logger } from '@/lib/logger';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '../constants';
import { dailyKidReportRepo, dcrRepo, observationRepo } from '../repositories';
import * as templateRepo from '../repositories/report-template';
import { DailyKidReportItem } from '../types';
import { DailyKidReportInput } from '../validation';

// Types

export type GeneratedReport = {
  kidId: string;
  kidName: string;
  narrative: string;
};

// Helpers

async function getValidatedDataByDcrObservationId(dcrObservationId: string) {
  const observation = await observationRepo.findByIdWithKid(dcrObservationId);
  if (!observation) {
    return {
      success: false as const,
      message: 'Data observasi tidak ditemukan. Isi observasi terlebih dahulu',
    };
  }
  const dcr = await dcrRepo.findByIdWithReportData(observation.dcrId);
  if (!dcr)
    return {
      success: false as const,
      message: 'Data laporan harian kelas tidak ditemukan',
    };
  const dailyKidReport = await dailyKidReportRepo.findByDcrObservationId(
    observation.id
  );

  return {
    success: true as const,
    data: { dcr, observation, dailyKidReport },
  };
}

async function generateDefaultNarrative({
  dcr,
  observation,
}: DailyReportTemplateRenderData) {
  const defaultReportTemplate = (await templateRepo.findDefault())?.content;
  if (!defaultReportTemplate)
    return {
      success: false as const,
      message: 'Belum ada template yang disimpan',
    };

  const defaultNarrative = renderDailyReportTemplate({
    template: defaultReportTemplate,
    dcrData: { dcr, observation },
  });

  return {
    success: true as const,
    data: defaultNarrative,
  };
}

export async function generateDailyKidReportsByDcrId(
  dcrId: string
): Promise<ActionResult<GeneratedReport[]>> {
  try {
    const existingDCR = await dcrRepo.findByIdWithObservations(dcrId);
    if (!existingDCR) {
      return {
        success: false as const,
        message: 'Laporan harian tidak ditemukan.',
      };
    }
    const tmpl = await templateRepo.findDefault();
    if (!tmpl) {
      throw new Error('Template laporan belum diatur.');
    }
    // Resolve sub-theme name via repository
    let subThemeName = '';
    if (existingDCR.subThemeId) {
      subThemeName =
        (await themeService.getSubThemeById(existingDCR.subThemeId)).data
          ?.name ?? '';
    }

    const template = tmpl.content;
    const reports: GeneratedReport[] = [];
    for (const obs of existingDCR.observations) {
      if (obs.attendance !== 'present') continue;

      const data: TemplateData = {
        nickName: obs.kid.nickName ?? obs.kid.name,
        fullName: obs.kid.name,
        subThemeName,
        description: existingDCR.description ?? '',
        mood: obs.mood ? KID_MOOD_LABELS[obs.mood] : '',
        appetite: obs.appetite ? KID_APPETITE_LABELS[obs.appetite] : '',
        attendance: KID_ATTENDANCE_LABELS[obs.attendance],
        notes: obs.notes ?? '',
      };

      const narrative = renderTemplate(template, data);
      reports.push({ kidId: obs.kidId, kidName: obs.kid.name, narrative });
    }

    return {
      success: true as const,
      message: 'Laporan harian berhasil dibuat.',
      data: reports,
    };
  } catch (error) {
    console.error('generateDailyKidReportsByDcrId:', error);
    return {
      success: false as const,
      message: 'Gagal membuat laporan harian.',
    };
  }
}

// Read

export async function getDailyKidReportsByDcrId(
  dcrId: string
): Promise<ActionResult<unknown>> {
  try {
    const existingDCR = await dcrRepo.findByIdWithObservations(dcrId);
    if (!existingDCR) {
      return {
        success: false as const,
        message: 'Laporan harian tidak ditemukan.',
      };
    }

    const dcr = await dcrRepo.findByIdWithReports(dcrId);

    return {
      success: true as const,
      data: dcr,
    };
  } catch (error) {
    console.error('getDailyKidReportsByDcrId:', error);
    return {
      success: false as const,
      message: 'Gagal mengambil laporan harian.',
    };
  }
}

// Upsert

export async function saveReportNarrative(
  input: DailyKidReportInput
): Promise<ActionResult<DailyKidReportItem | null>> {
  try {
    // 1. Validate observation and load required report data
    const context = await getValidatedDataByDcrObservationId(
      input.dcrObservationId
    );
    if (!context.success) return context;
    const {
      dcr,
      observation,
      dailyKidReport: existingKidReport,
    } = context.data;

    const isDailyKidReportSent = existingKidReport?.reportStatus === 'sent';
    if (isDailyKidReportSent)
      return {
        success: false,
        message: 'Laporan yang sudah terkirim tidak bisa dirubah lagi',
      };

    // 2. Generate default narrative from default report template
    const defaultNarrativeResults = await generateDefaultNarrative({
      dcr,
      observation,
    });
    if (!defaultNarrativeResults.success) return defaultNarrativeResults;
    const defaultNarrative = defaultNarrativeResults.data;

    // 3. Skip saving if the narrative was not manually edited
    const hasDifferentFromDefault = input.narrative !== defaultNarrative;

    if (!hasDifferentFromDefault) {
      if (existingKidReport) {
        await dailyKidReportRepo.remove(existingKidReport.id);
      }
      return {
        success: true as const,
        message: 'Data sama dengan template',
        data: null,
      };
    }

    //4. Save edited report data
    if (!existingKidReport) {
      const newReport = await dailyKidReportRepo.insert({
        dcrObservationId: input.dcrObservationId,
        narrative: input.narrative,
        reportStatus: 'edited',
      });
      return {
        success: true as const,
        message: 'Narasi laporan berhasi disimpan',
        data: newReport,
      };
    }
    const updatedReport = await dailyKidReportRepo.update(
      existingKidReport.id,
      {
        narrative: input.narrative,
        reportStatus: 'edited',
      }
    );
    return {
      success: true as const,
      message: 'Narasi laporan berhasil diperbarui',
      data: updatedReport,
    };
  } catch (error) {
    logger.error(
      { err: error, dcrObservationId: input.dcrObservationId },
      'Failed to save report narration'
    );
    console.error('saveReportNarration:', error);
    return {
      success: false as const,
      message: 'Gagal menyimpan draft laporan',
    };
  }
}

export async function markReportAsSent({
  dcrObservationId,
}: {
  dcrObservationId: string;
}) {
  try {
    // 1. Validate observation and load required report data
    const context = await getValidatedDataByDcrObservationId(dcrObservationId);
    if (!context.success) return context;
    const { dcr, observation, dailyKidReport } = context.data;
    if (!dailyKidReport)
      return {
        success: false as const,
        message:
          'Tidak ada laporan sebelumnya. Buat observasi terlebih dahulu.',
      };

    const isDailyKidReportSent = dailyKidReport.reportStatus === 'sent';
    if (isDailyKidReportSent)
      return {
        success: true as const,
        message: 'Status laporan sudah terkirim sebelumnya',
      };

    // 2. Persist narrative and marking sent
    const hasSavedNarrative =
      dailyKidReport.reportStatus === 'edited' &&
      Boolean(dailyKidReport.narrative?.trim());
    const defaultNarrativeResults = await generateDefaultNarrative({
      dcr,
      observation,
    });
    if (!defaultNarrativeResults.success) return defaultNarrativeResults;
    const defaultNarrative = defaultNarrativeResults.data;
    await dailyKidReportRepo.update(dailyKidReport.id, {
      narrative: hasSavedNarrative ? undefined : defaultNarrative,
      reportStatus: 'sent',
      sentAt: new Date(),
    });
    return {
      success: true as const,
      message: 'Status laporan menjadi terkirim',
    };
  } catch (error) {
    logger.error(
      { err: error, dcrObservationId },
      'Failed to mark report as sent '
    );
    return {
      success: false as const,
      message: 'Gagal menandai laporan terkirim',
    };
  }
}
