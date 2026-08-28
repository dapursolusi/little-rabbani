import * as termRepo from './repositories';

const INDONESIAN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function toRoman(n: number): string {
  const numerals: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  for (const [value, symbol] of numerals) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

function formatTermName(
  startDate: string,
  endDate: string,
  seq: number
): string {
  const year = startDate.split('-')[0];
  const month = (d: string) => INDONESIAN_MONTHS[Number(d.split('-')[1]) - 1];
  return `Batch ${toRoman(seq)} ${year} (${month(startDate)} - ${month(endDate)})`;
}

export async function checkCurrentTerm() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const currentTerm = await termRepo.findCurrentTerm(today);

    if (currentTerm) return { success: true as const, data: currentTerm };

    const terms = await termRepo.findAllTerms();
    const latestTerm = terms[0];

    // Only auto-create when the latest batch has actually ended — never on top
    // of a future-dated one. Otherwise hand back whatever we have.
    if (latestTerm && !(latestTerm.endDate < today)) {
      return { success: true as const, data: latestTerm };
    }

    const startDate = today;
    const base = new Date(today).getTime();
    const endDate = latestTerm
      ? new Date(
          base +
            new Date(latestTerm.endDate).getTime() -
            new Date(latestTerm.startDate).getTime()
        )
          .toISOString()
          .split('T')[0]
      : new Date(base + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const insertedTerm = await termRepo.insertTerm({
      name: formatTermName(startDate, endDate, terms.length + 1),
      startDate,
      endDate,
      isAutoCreated: true,
    });

    return { success: true as const, data: insertedTerm };
  } catch (error) {
    console.error('checkCurrentTerm', error);
    return { success: false as const, error: 'Gagal membuat batch baru' };
  }
}

export async function checkNextTerm() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [currentTerm, nextTerm] = await Promise.all([
      termRepo.findCurrentTerm(today),
      termRepo.findNextTerm(today),
    ]);

    // Next term already ready — nothing to do.
    if (nextTerm) return { success: true as const, data: nextTerm };
    // No active term to base the next one on — checkCurrentTerm owns the
    // "app untouched for months" edge case (creates a fresh current term).
    if (!currentTerm) return { success: true as const, data: undefined };

    const terms = await termRepo.findAllTerms();

    // Term N+1 starts the day after term N ends — no overlap, no gap.
    const duration =
      new Date(currentTerm.endDate).getTime() -
      new Date(currentTerm.startDate).getTime();
    const startDate = new Date(
      new Date(currentTerm.endDate).getTime() + 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0];
    const endDate = new Date(new Date(startDate).getTime() + duration)
      .toISOString()
      .split('T')[0];

    const insertedTerm = await termRepo.insertTerm({
      name: formatTermName(startDate, endDate, terms.length + 1),
      startDate,
      endDate,
      isAutoCreated: true,
    });

    return { success: true as const, data: insertedTerm };
  } catch (error) {
    console.error('checkNextTerm', error);
    return {
      success: false as const,
      error: 'Gagal menyiapkan batch berikutnya',
    };
  }
}
