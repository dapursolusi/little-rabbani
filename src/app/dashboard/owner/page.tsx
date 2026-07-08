import { Suspense } from 'react';

import { QuickActions } from '@/components/sections/owner-dashboard/quick-actions';
import {
  DashboardStatCards,
  DashboardStatCardsSkeleton,
} from '@/components/sections/owner-dashboard/stat-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getOwnerDashboardStats } from '@/lib/actions/dashboard';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Dashboard Owner' };

async function DashboardContent() {
  const stats = await getOwnerDashboardStats();

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <DashboardStatCards
        activeTerm={stats.activeTerm}
        enrolledKidsCount={stats.enrolledKidsCount}
        todaySessionsCount={stats.todaySessionsCount}
        pendingDcrsCount={stats.pendingDcrsCount}
        pendingReportsCount={stats.pendingReportsCount}
      />

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickActions />
        </CardContent>
      </Card>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<DashboardStatCardsSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
