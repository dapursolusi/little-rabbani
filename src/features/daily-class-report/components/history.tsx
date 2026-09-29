import { useEffect, useMemo, useState } from 'react';

import { Calendar } from '@/components/ui/calendar';

import { dcrAction } from '../actions';
import { DailyClassReport } from '../types';

export default function DCRHistory({
  defaultDcrs,
}: {
  defaultDcrs: DailyClassReport[];
}) {
  const today = useMemo(() => new Date(new Date().toDateString()), []);
  const [month, setMonth] = useState<Date>(today);
  const [dcrs, setDcrs] = useState<DailyClassReport[]>(defaultDcrs);

  // Fast Set lookup for dates that have DCRs
  const dcrDates = useMemo(() => new Set(dcrs.map((d) => d.date)), [dcrs]);

  useEffect(() => {
    async function fetch() {
      const result = await dcrAction.getDCRs({
        date: { year: month.getFullYear(), month: month.getMonth() + 1 },
      });
      if (result.success) setDcrs(result.data as DailyClassReport[]);
    }
    fetch();
  }, [month.getFullYear(), month.getMonth()]);

  return (
    <div className="w-full max-w-225 mx-auto">
      <Calendar
        mode="single"
        className="rounded-lg border bg-card p-2 mx-auto"
        classNames={{
          root: 'w-full sm:max-w-130',
        }}
        fixedWeeks
        modifiers={{
          haveDCR: (date: Date) =>
            dcrDates.has(date.toISOString().split('T')[0]),
          today: (date: Date) => date.getTime() === today.getTime(),
          weekend: (date) => [0, 6].includes(date.getDay()),
          greyedPast: (date: Date) => date < today,
        }}
        modifiersClassNames={{
          today: 'bg-primary/70 text-white',
          weekend: 'text-red-500',
          greyedPast: 'text-muted-foreground opacity-50',
          haveDCR:
            'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-green-500',
        }}
        weekStartsOn={1}
        month={month}
        onMonthChange={setMonth}
      />
    </div>
  );
}
