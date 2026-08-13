export function holidayRangeOverlap(
  date: string,
  holidays: Array<{ startDate: string; endDate: string }>
): boolean {
  const d = new Date(date + 'T00:00:00');
  return holidays.some((h) => {
    const start = new Date(h.startDate + 'T00:00:00');
    const end = new Date(h.endDate + 'T00:00:00');
    return d >= start && d <= end;
  });
}
