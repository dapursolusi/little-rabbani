/**
 * OpenRouter AI client for narrative generation.
 *
 * Provides `generateNarrative` which calls OpenRouter's chat completions API
 * with a fallback chain. All output is in Bahasa Indonesia.
 *
 * Fallback chain per ADR-0004:
 *   Primary: deepseek/deepseek-v4-flash (from OPENROUTER_MODEL env var)
 *   Fallback 1: google/gemini-2.0-flash-001
 *   Fallback 2: mistralai/mistral-small-3.1-24b-instruct
 */
import { logger } from '@/lib/logger';

import { env } from '../../env.mjs';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Default fallback models used when the primary model fails. */
const FALLBACK_MODELS = [
  'google/gemini-2.0-flash-001',
  'mistralai/mistral-small-3.1-24b-instruct',
];

/** Report type — affects the prompt context used by the AI. */
export type TReportType =
  'daily' | 'monthly' | 'quarterly' | 'quarterly-section';

/** Section type for quarterly-section report generation. */
export type TQuarterlySectionType =
  'changes' | 'improvements' | 'recommendations';

export interface TNarrativeContext {
  /** Kid's full name. */
  kidName: string;
  /** Mood level (1–5). */
  mood: number;
  /** Appetite level. */
  appetite: 'good' | 'moderate' | 'poor';
  /** List of activity names the kid participated in. */
  activities: string[];
  /** Free-text teacher notes (append-only). */
  notes?: string;
  /** Presence status. */
  presence?: 'present_full' | 'late' | 'early_pickup' | 'absent';
  /** Absence reason (if presence is 'absent'). */
  absenceReason?: 'sick' | 'family' | 'permission' | 'other' | string;
  /** Report type for prompt context (defaults to 'daily'). */
  reportType?: TReportType;
  /** Section type for quarterly-section report generation. */
  sectionType?: TQuarterlySectionType;
}

/**
 * Maps internal appetite values to Bahasa Indonesia for the prompt.
 */
function translateAppetite(value: string): string {
  const map: Record<string, string> = {
    good: 'baik',
    moderate: 'cukup',
    poor: 'kurang',
  };
  return map[value] ?? value;
}

/**
 * Maps internal presence values to Bahasa Indonesia.
 */
function translatePresence(value: string): string {
  const map: Record<string, string> = {
    present_full: 'hadir penuh',
    late: 'datang terlambat',
    early_pickup: 'dijemput lebih awal',
    absent: 'tidak hadir',
  };
  return map[value] ?? value;
}

/**
 * Maps internal absence reason to Bahasa Indonesia.
 */
function translateAbsenceReason(value: string): string {
  const map: Record<string, string> = {
    sick: 'sakit',
    family: 'keperluan keluarga',
    permission: 'izin',
    other: 'alasan lain',
  };
  return map[value] ?? value;
}

/**
 * Builds the system prompt that instructs the AI model to
 * generate a warm narrative in Bahasa Indonesia addressing the guardian.
 */
function buildSystemPrompt(
  reportType?: TReportType,
  sectionType?: TQuarterlySectionType
): string {
  if (reportType === 'monthly') {
    return `Anda adalah asisten guru PAUD yang membantu membuat laporan bulanan untuk wali murid.

Tugas Anda:
- Buat narasi hangat dan personal dalam Bahasa Indonesia yang ditujukan langsung kepada wali murid.
- Gunakan sapaan "Bu/Pak" dan panggilan "Ananda" diikuti nama anak.
- Narasi adalah ringkasan bulanan yang terdiri dari 3-4 paragraf yang menggambarkan perkembangan anak selama satu bulan penuh.
- Cantumkan informasi tentang kehadiran, suasana hati (mood), nafsu makan, aktivitas yang diikuti, dan catatan guru sepanjang bulan.
- Gunakan kalimat-kalimat yang merangkum pengalaman anak selama sebulan, seperti "Selama bulan ini..." atau "Sepanjang bulan...".
- Gunakan bahasa yang hangat, positif, dan mendukung.
- Jangan menambahkan informasi yang tidak ada dalam data yang diberikan.
- Jangan gunakan tanda bintang (*) atau markdown. Gunakan paragraf biasa.
- Jangan gunakan frasa "hari ini" — ini adalah laporan bulanan.`;
  }

  if (reportType === 'quarterly-section') {
    const sectionLabels: Record<TQuarterlySectionType, string> = {
      changes: 'Perubahan',
      improvements: 'Peningkatan',
      recommendations: 'Rekomendasi',
    };
    const label = sectionLabels[sectionType ?? 'changes'];
    return `Anda adalah asisten guru PAUD yang membantu membuat laporan trivulanan untuk wali murid.

Tugas Anda:
- Buat SATU bagian dari laporan trivulanan dalam Bahasa Indonesia yang ditujukan langsung kepada wali murid.
- Gunakan sapaan "Bu/Pak" dan panggilan "Ananda" diikuti nama anak.
- Bagian ini adalah "${label}" — ${getSectionDescription(sectionType ?? 'changes')}
- Gunakan bahasa yang hangat, positif, dan mendukung.
- Tulis 2-3 paragraf yang informatif dan personal.
- Jangan menambahkan informasi yang tidak ada dalam data yang diberikan.
- Jangan gunakan tanda bintang (*) atau markdown. Gunakan paragraf biasa.
- JANGAN menuliskan label atau judul bagian. Langsung tulis konten paragraf.`;
  }

  return `Anda adalah asisten guru PAUD yang membantu membuat laporan harian untuk wali murid.

Tugas Anda:
- Buat narasi hangat dan personal dalam Bahasa Indonesia yang ditujukan langsung kepada wali murid.
- Gunakan sapaan "Bu/Pak" dan panggilan "Ananda" diikuti nama anak.
- Narasi terdiri dari 2-3 paragraf yang menggambarkan hari anak di sekolah.
- Cantumkan informasi tentang suasana hati (mood), nafsu makan, aktivitas yang diikuti, dan catatan guru.
- Gunakan bahasa yang hangat, positif, dan mendukung.
- Jangan menambahkan informasi yang tidak ada dalam data yang diberikan.
- Jangan gunakan tanda bintang (*) atau markdown. Gunakan paragraf biasa.

Contoh gaya:
"Bu/Pak, hari ini Ananda [nama] bersekolah dengan penuh semangat. Beliau mengikuti kegiatan [aktivitas] dengan antusias.

Nafsu makan Ananda [nama] hari ini [baik/cukup/kurang]. Beliau [menghabiskan/menikmati] bekalnya dengan lahap.

Kami bersyukur melihat perkembangan positif pada Ananda [nama]. Semoga Ananda [nama] tetap sehat dan bersemangat belajar."`;
}

/**
 * Returns a description prompt for a given quarterly section type.
 */
function getSectionDescription(sectionType: TQuarterlySectionType): string {
  switch (sectionType) {
    case 'changes':
      return 'Jelaskan apa yang berubah pada Ananda selama trivulan ini. Bandingkan dengan trivulan sebelumnya jika ada data delta. Fokus pada perubahan perilaku, kebiasaan, interaksi sosial, dan pola kehadiran.';
    case 'improvements':
      return 'Jelaskan apa yang meningkat pada Ananda selama trivulan ini. Sebutkan area-area kemajuan signifikan seperti partisipasi aktivitas, stabilitas suasana hati, nafsu makan, atau keterampilan sosial.';
    case 'recommendations':
      return 'Berikan saran spesifik dan actionable untuk wali murid dan guru dalam mendukung perkembangan Ananda ke depannya. Rekomendasi harus praktis dan disesuaikan dengan data yang ada.';
  }
}

/**
 * Builds the user prompt with the kid's observation data.
 * Supports daily, monthly, and quarterly report types.
 */
function buildUserPrompt(context: TNarrativeContext): string {
  const { kidName, mood, appetite, activities, notes, reportType } = context;

  // For monthly reports, use a monthly-specific prompt that includes daily narratives
  if (reportType === 'monthly') {
    const appetiteId = translateAppetite(appetite);
    const activitiesList =
      activities.length > 0
        ? activities.map((a) => `- ${a}`).join('\n')
        : 'Tidak ada aktivitas tercatat';

    // Build daily narratives section if notes contain narrative texts
    let dailyNarrativesSection = '';
    if (notes && notes.length > 0) {
      dailyNarrativesSection = `\nBerikut adalah narasi laporan harian Ananda ${kidName} selama bulan ini yang dapat dijadikan referensi:\n${notes}`;
    }

    return `Buatkan laporan bulanan untuk wali murid Ananda ${kidName}.

Ringkasan statistik bulan ini:
- Nama anak: ${kidName}
- Rata-rata suasana hati (mood): ${mood}/5
- Rata-rata nafsu makan: ${appetiteId}
- Aktivitas yang diikuti:
${activitiesList}
${dailyNarrativesSection}

Tulis narasi ringkasan bulanan yang hangat sebanyak 3-4 paragraf dalam Bahasa Indonesia yang ditujukan kepada wali murid. Ini adalah laporan bulanan, jangan gunakan frasa "hari ini".`;
  }

  // For quarterly-section, build a focused prompt for each section
  if (reportType === 'quarterly-section') {
    const sectionType = context.sectionType ?? 'changes';
    const sectionLabels: Record<TQuarterlySectionType, string> = {
      changes: 'Perubahan',
      improvements: 'Peningkatan',
      recommendations: 'Rekomendasi',
    };
    const label = sectionLabels[sectionType];

    // Parse stats and daily narratives from the notes field
    // notes format: "STATS:...\n\nNARRATIVES:...\n\nDELTA:..."
    const statsNote = notes?.match(/STATS:\n([\s\S]*?)(?:\n\nNARRATIVES:|$)/);
    const narrativesNote = notes?.match(
      /NARRATIVES:\n([\s\S]*?)(?:\n\nDELTA:|$)/
    );
    const deltaNote = notes?.match(/DELTA:\n([\s\S]*)$/);

    const statsText = statsNote?.[1]?.trim() ?? 'Tidak ada data statistik.';
    const narrativesText =
      narrativesNote?.[1]?.trim() ?? 'Tidak ada data narasi harian.';
    const deltaText = deltaNote?.[1]?.trim();

    // Build section-specific prompt
    const promptParts: string[] = [
      `Buatkan bagian "${label}" dari laporan trivulanan untuk wali murid Ananda ${kidName}.`,
    ];

    if (sectionType === 'changes') {
      promptParts.push(
        `Fokus pada: Apa yang berubah pada Ananda ${kidName} selama trivulan ini? Perubahan perilaku, kebiasaan, interaksi sosial, dan pola kehadiran.`
      );
    } else if (sectionType === 'improvements') {
      promptParts.push(
        `Fokus pada: Apa yang meningkat pada Ananda ${kidName}? Kemajuan dalam partisipasi aktivitas, stabilitas suasana hati, nafsu makan, atau keterampilan sosial.`
      );
    } else if (sectionType === 'recommendations') {
      promptParts.push(
        `Fokus pada: Saran spesifik dan praktis untuk wali murid dan guru dalam mendukung perkembangan Ananda ${kidName} ke depannya.`
      );
    }

    promptParts.push(``);
    promptParts.push(`DATA STATISTIK TRIVULAN INI:`);
    promptParts.push(statsText);

    promptParts.push(``);
    promptParts.push(`NARASI HARIAN:`);
    promptParts.push(narrativesText);

    if (deltaText) {
      promptParts.push(``);
      promptParts.push(`LAPORAN TRIVULAN SEBELUMNYA:`);
      promptParts.push(deltaText);
    }

    promptParts.push(``);
    promptParts.push(
      `Tulis 2-3 paragraf dalam Bahasa Indonesia yang hangat dan personal. Jangan gunakan markdown. Jangan tulis judul atau label bagian — langsung tulis konten paragraf.`
    );

    return promptParts.join('\n');
  }

  const {
    kidName: name,
    mood: moodLevel,
    appetite: app,
    activities: acts,
    notes: nts,
    presence: pres,
    absenceReason: reason,
  } = context;

  const appetiteId = translateAppetite(app);
  const activitiesList =
    acts.length > 0
      ? acts.map((a) => `- ${a}`).join('\n')
      : 'Tidak ada aktivitas tercatat';

  let presenceInfo: string;
  if (pres === 'absent' && reason) {
    const reasonId = translateAbsenceReason(reason);
    presenceInfo = `Ananda ${name} tidak hadir hari ini karena ${reasonId}.`;
  } else if (pres && pres !== 'present_full') {
    presenceInfo = `Ananda ${name} ${translatePresence(pres)} hari ini.`;
  } else {
    presenceInfo = `Ananda ${name} hadir penuh hari ini.`;
  }

  return `Buatkan laporan harian untuk wali murid Ananda ${name}.

Data hari ini:
- Nama anak: ${name}
- Suasana hati (mood): ${moodLevel}/5
- Nafsu makan: ${appetiteId}
- ${presenceInfo}
- Aktivitas yang diikuti:
${activitiesList}
${nts ? `- Catatan guru: ${nts}` : ''}

Tulis narasi hangat 2-3 paragraf dalam Bahasa Indonesia yang ditujukan kepada wali murid.`;
}

/**
 * Calls the OpenRouter API with the given model and messages.
 * Returns the response text or throws on failure.
 */
async function callOpenRouter(
  model: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal
): Promise<string> {
  const timeoutSignal = AbortSignal.timeout(30_000);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': env.NEXT_PUBLIC_APP_URL,
      'X-Title': 'Little Rabbani - Laporan Harian',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    signal: combinedSignal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `OpenRouter API error: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter returned empty response');
  }

  return content.trim();
}

/**
 * Generates a warm 2–3 paragraph narrative in Bahasa Indonesia about a kid's
 * day, addressing the guardian directly.
 *
 * Uses the primary model from OPENROUTER_MODEL env var (default:
 * `deepseek/deepseek-v4-flash`) with a fallback chain on failure.
 *
 * @param context - The kid's observation data for the narrative.
 * @returns The narrative text, or empty string if all models fail.
 */
export async function generateNarrative(
  context: TNarrativeContext
): Promise<string> {
  const reportType = context.reportType ?? 'daily';
  const sectionType = context.sectionType;
  const systemPrompt = buildSystemPrompt(reportType, sectionType);
  const userPrompt = buildUserPrompt(context);
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const primaryModel = env.OPENROUTER_MODEL;
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS];

  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const content = await callOpenRouter(model, messages);
      logger.info({ model }, 'Narrative generated successfully');
      return content;
    } catch (error) {
      lastError = error;
      logger.warn(
        { model, err: error },
        'OpenRouter model failed, trying fallback'
      );
    }
  }

  // All models failed — log the error and return empty string gracefully
  logger.error(
    { err: lastError, modelsTried: modelsToTry },
    'All OpenRouter models failed, returning empty narrative'
  );
  return '';
}
