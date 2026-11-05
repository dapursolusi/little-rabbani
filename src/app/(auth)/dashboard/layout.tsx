import { headers } from 'next/headers';

import { navGroups, schools } from '@/config/navigation';
import { OngoingTermProvider } from '@/contexts/ongoing-term';
import * as termAction from '@/features/term/actions';

import { AppSidebar } from '@/components/layout/app-sidebar';
import OngoingTermLabel from '@/components/layout/ongoing-term-label';
import { SidebarBreadcrumb } from '@/components/layout/sidebar/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

import { auth } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  await termAction.checkNextTerm();
  return (
    <TooltipProvider>
      <OngoingTermProvider>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar
            user={session?.user}
            navGroups={navGroups}
            schools={schools}
          />
          <SidebarInset>
            {/* Top bar */}
            <header className="sticky top-0 z-10 flex items-center gap-2 border-b border bg-card px-4 py-2">
              <div className="flex items-center gap-2 w-max">
                <SidebarTrigger />
                <Separator orientation="vertical" />
                <SidebarBreadcrumb />
              </div>
              <OngoingTermLabel />
            </header>
            {/* Page content */}
            <main className="flex-1 bg-brand-canvas sm:p-6 p-2">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </OngoingTermProvider>
    </TooltipProvider>
  );
}
