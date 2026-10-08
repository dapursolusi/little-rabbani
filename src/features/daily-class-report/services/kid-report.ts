import * as themeService from '@/features/theme/services';
import { ActionResult } from '@/types';
import {
  TemplateData,
  renderDailyReportTemplate,
  renderTemplate,
} from '@/utils/template';

import {
  KID_APPETITE_LABELS,
  KID_ATTENDANCE_LABELS,
  KID_MOOD_LABELS,
} from '../constants';
import { dailyKidReportRepo, dcrRepo, observationRepo } from '../repositories';
import * as templateRepo from '../repositories/report-template';
import { DailyKidReportInput } from '../validation';

export type GeneratedReport = {
  kidId: string;
  kidName: string;
  narrative: string;
};

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

export async function saveReportNarration(input: DailyKidReportInput) {
  try {
    // 1. Validate observation and load required report data
    const existingObservation = await observationRepo.findByIdWithKid(
      input.dcrObservationId
    );
    if (!existingObservation) {
      return {
        success: false as const,
        message:
          'Data observasi tidak ditemukan. Isi observasi terlebih dahulu',
      };
    }
    const dcr = await dcrRepo.findByIdWithReportData(existingObservation.dcrId);
    if (!dcr)
      return {
        success: false as const,
        message: 'Data laporan harian tidak ditemukan',
      };

    // 2. Generate default narrative from default report template
    const defaultReportTemplate = (await templateRepo.findDefault())?.content;

    const defaultNarrative = renderDailyReportTemplate({
      template: defaultReportTemplate as string,
      dcrData: { dcr, observation: existingObservation },
    });

    // 3. Skip saving if the narrative was not manually edited
    const hasDifferentFromDefault = input.narrative !== defaultNarrative;
    if (!hasDifferentFromDefault) {
      return {
        success: true as const,
        data: null,
      };
    }

    //4. Save edited report data
    const existingKidReport = await dailyKidReportRepo.findByDcrObservationId(
      existingObservation.id
    );
    if (!existingKidReport) {
      await dailyKidReportRepo.insert({
        dcrObservationId: input.dcrObservationId,
        narrative: input.narrative,
        statusReport: 'edited',
      });
      return {
        success: true as const,
        message: 'Narasi laporan berhasi disimpan',
      };
    }
    await dailyKidReportRepo.update(existingKidReport.id, {
      narrative: input.narrative,
      statusReport: 'edited',
    });
    return {
      success: true as const,
      message: 'Narasi laporan berhasil diperbarui',
    };
  } catch (error) {
    console.error('saveReportNarration:', error);
    return {
      success: false as const,
      message: 'Gagal menyimpan draft laporan',
    };
  }
}
