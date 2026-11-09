'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import { ClassReportKid, ClassReportOverview } from '@/features/report/types';
import { buildReportableMonths } from '@/features/report/utils';
import { Term } from '@/features/term/types';
import { formatDate } from '@/utils/date';
import { pushParam } from '@/utils/search-params';
import { Alert01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import ClassSessionSelector from '@/components/features/class-session/class-session-selector';
import TermSelector from '@/components/features/term/term-selector';
import { EmptyState } from '@/components/shared/empty-state';
import { getStatusBadge } from '@/components/shared/get-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthlyReportClientProps {
  terms: Term[];
  classSessions: ClassSession[];
  currentTermId: string;
  currentClassSessionId: string;
  currentMonth: string;
  overview: ClassReportOverview;
}

function MonthSelector({
  term,
  currentMonth,
}: {
  term: Term;
  currentMonth: string;
}) {
  const router = useRouter();
  // Only months that have already started can be reported on.
  const months = buildReportableMonths([term]);

  return (
    <div className="mb-1.5 flex flex-col items-start gap-3">
      <Label
        htmlFor="month-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Bulan
      </Label>
      <Select
        value={currentMonth}
        onValueChange={(month) =>
          month && pushParam({ key: 'month', value: month, router })
        }
      >
        <SelectTrigger id="month-select" className="w-full">
          <SelectValue>{formatDate(currentMonth)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {formatDate(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function ReadinessBadge({ kid }: { kid: ClassReportKid }) {
  if (!kid.ready) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 text-destructive"
      >
        <HugeiconsIcon icon={Alert01Icon} data-icon="inline-start" />
        Data kurang
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-success/30 text-success">
      <HugeiconsIcon icon={CheckmarkCircle01Icon} data-icon="inline-start" />
      Siap
    </Badge>
  );
}

function ChildItem({
  kid,
  termId,
  month,
  isFinalMonth,
}: {
  kid: ClassReportKid;
  termId: string;
  month: string;
  isFinalMonth: boolean;
}) {
  const href = `/dashboard/report/kid/${kid.kidId}?termId=${termId}&month=${month}`;

  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>{kid.name}</ItemTitle>
        {kid.nickName && <ItemDescription>{kid.nickName}</ItemDescription>}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <ReadinessBadge kid={kid} />
          {kid.reportStatus ? (
            getStatusBadge(kid.reportStatus)
          ) : (
            <Badge variant="secondary">Belum dibuat</Badge>
          )}
          {kid.isEdited && <Badge variant="secondary">Diedit manual</Badge>}
        </div>
        {!kid.ready && kid.readinessReason && (
          <ItemDescription className="pt-1">
            {kid.readinessReason}
          </ItemDescription>
        )}
      </ItemContent>
      {kid.reportStatus ? (
        <ItemActions>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={href} />}
          >
            Buka laporan
          </Button>
        </ItemActions>
      ) : (
        // The final month uses termly reporting — generation is refused
        // there, so a "create" action would open a dead end.
        kid.ready &&
        !isFinalMonth && (
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={href} />}
            >
              Buat laporan
            </Button>
          </ItemActions>
        )
      )}
    </Item>
  );
}

export default function MonthlyReportClient({
  terms,
  classSessions,
  currentTermId,
  currentClassSessionId,
  currentMonth,
  overview,
}: MonthlyReportClientProps) {
  const router = useRouter();
  const term = terms.find((t) => t.id === currentTermId);
  const { kids, summary } = overview;

  return (
    <div>
      <TermSelector
        terms={terms}
        value={currentTermId || undefined}
        onValueChange={(termId) => {
          // A month and class belong to a term; drop stale selections with it.
          const params = new URLSearchParams(window.location.search);
          params.delete('month');
          params.delete('classSessionId');
          params.set('termId', termId);
          router.push(`?${params.toString()}`);
        }}
      />
      <ClassSessionSelector
        classSessions={classSessions}
        value={currentClassSessionId}
        onValueChange={(classSessionId) =>
          pushParam({ key: 'classSessionId', value: classSessionId, router })
        }
      />
      {term && <MonthSelector term={term} currentMonth={currentMonth} />}

      {!currentTermId ? (
        <p className="pt-4">Pilih batch terlebih dahulu!</p>
      ) : kids.length === 0 ? (
        <EmptyState
          title="Belum ada anak di kelas ini"
          description="Tidak ada anak terdaftar pada batch dan sesi kelas yang dipilih."
        />
      ) : (
        <div className="flex flex-col gap-4 pt-4">
          {overview.isFinalMonth && (
            <p className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
              Bulan terakhir batch menggunakan laporan triwulanan, bukan laporan
              bulanan.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Total anak" value={summary.totalKids} />
            <SummaryStat label="Laporan ada" value={summary.withReport} />
            <SummaryStat
              label="Siap dibuat"
              value={summary.eligibleWithoutReport}
            />
            <SummaryStat
              label="Data kurang"
              value={summary.insufficientWithoutReport}
            />
          </div>

          {summary.withReport === 0 && (
            <p className="text-sm text-muted-foreground">
              Belum ada laporan yang dibuat
            </p>
          )}

          {summary.eligibleWithoutReport > 0 && !overview.isFinalMonth && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <Button
                disabled
                aria-describedby="batch-generation-note"
                className="w-full sm:w-fit"
              >
                Buat laporan tersisa ({summary.eligibleWithoutReport})
              </Button>
              <p
                id="batch-generation-note"
                className="text-xs text-muted-foreground"
              >
                Pembuatan massal belum tersedia.
              </p>
            </div>
          )}

          <ItemGroup>
            {kids.map((kid) => (
              <ChildItem
                key={kid.kidId}
                kid={kid}
                termId={currentTermId}
                month={currentMonth}
                isFinalMonth={overview.isFinalMonth}
              />
            ))}
          </ItemGroup>
        </div>
      )}
    </div>
  );
}
