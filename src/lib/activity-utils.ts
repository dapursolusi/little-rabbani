const CATEGORY_LABELS: Record<string, string> = {
  seni: 'Seni',
  olahraga: 'Olahraga',
  musik: 'Musik',
  bahasa: 'Bahasa',
  matematika: 'Matematika',
  sains: 'Sains',
  agama: 'Agama',
  bermain: 'Bermain',
  outing: 'Outing',
  lainnya: 'Lainnya',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function getCategoryOptions(): Array<{ value: string; label: string }> {
  return Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}
