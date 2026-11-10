import { useRouter } from 'next/navigation';

import { formatDate } from '@/utils/date';
import { pushParam } from '@/utils/search-params';
import {
  SquareChevronLeftIcon,
  SquareChevronRightIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function MonthPicker({
  currentMonth,
  prevMonth,
  nextMonth,
}: {
  currentMonth: string;
  prevMonth: string | null;
  nextMonth: string | null;
}) {
  const router = useRouter();
  const goTo = (month: string) =>
    pushParam({ key: 'month', value: month, router });

  return (
    <div className="my-2 flex items-center justify-between border-2 rounded-xl">
      <Tooltip>
        <TooltipTrigger
          render={
            <span>
              <Button
                aria-label="Bulan sebelumnya"
                className="w-fit"
                disabled={!prevMonth}
                onClick={() => prevMonth && goTo(prevMonth)}
              >
                <HugeiconsIcon icon={SquareChevronLeftIcon} size={100} />
              </Button>
            </span>
          }
        />
        {!prevMonth && (
          <TooltipContent>Tidak ada laporan sebelumnya</TooltipContent>
        )}
      </Tooltip>
      <span>{formatDate(currentMonth)}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <span>
              <Button
                aria-label="Bulan berikutnya"
                className="w-fit"
                disabled={!nextMonth}
                onClick={() => nextMonth && goTo(nextMonth)}
              >
                <HugeiconsIcon icon={SquareChevronRightIcon} size={100} />
              </Button>
            </span>
          }
        />
        {!nextMonth && (
          <TooltipContent>Tidak ada laporan setelah bulan ini</TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
