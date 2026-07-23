import Link from 'next/link';

import {
  CalendarCheckIcon,
  ClipboardIcon,
  File02Icon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
}

function StatCard({ title, value, icon, href }: StatCardProps) {
  const content = (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 p-1.5 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface DashboardStatCardsProps {
  activeTerm: { id: string; name: string } | null;
  enrolledKidsCount: number;
  todaySessionsCount: number;
  pendingDcrsCount: number;
  pendingReportsCount: number;
}

export function DashboardStatCards({
  activeTerm,
  enrolledKidsCount,
  todaySessionsCount,
  pendingDcrsCount,
  pendingReportsCount,
}: DashboardStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={
          activeTerm ? `Term Aktif: ${activeTerm.name}` : 'Tidak Ada Term Aktif'
        }
        value={enrolledKidsCount}
        icon={<HugeiconsIcon icon={UserMultipleIcon} strokeWidth={2} />}
        href="/dashboard/owner/kid"
      />
      <StatCard
        title="Sesi Hari Ini"
        value={todaySessionsCount}
        icon={<HugeiconsIcon icon={CalendarCheckIcon} strokeWidth={2} />}
        href="/dashboard/owner/calendar"
      />
      <StatCard
        title="DCR Tertunda"
        value={pendingDcrsCount}
        icon={<HugeiconsIcon icon={ClipboardIcon} strokeWidth={2} />}
        href="/dashboard/owner/dcr"
      />
      <StatCard
        title="Laporan Tertunda"
        value={pendingReportsCount}
        icon={<HugeiconsIcon icon={File02Icon} strokeWidth={2} />}
        href="/dashboard/owner/reports/daily"
      />
    </div>
  );
}

export function DashboardStatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
