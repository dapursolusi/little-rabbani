import { DashboardStatCardsSkeleton } from '@/components/sections/owner-dashboard/stat-cards';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function OwnerDashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <DashboardStatCardsSkeleton />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-36 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
