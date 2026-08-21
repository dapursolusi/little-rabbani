import { headers } from 'next/headers';

import { checkCurrentTerm, checkNextTerm } from '@/features/term/actions';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarBreadcrumb } from '@/components/layout/sidebar/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { auth } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const currentTerm = await checkCurrentTerm();
  await checkNextTerm();
  const termLabel = currentTerm.success ? currentTerm.data.name : null;
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar user={session?.user} />
      <SidebarInset>
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border bg-card px-4 py-2">
          <div className="flex items-center gap-2 w-max">
            <SidebarTrigger />
            <Separator orientation="vertical" />
            <SidebarBreadcrumb />
          </div>
          {termLabel && (
            <Badge variant="default" className="ml-auto bg-primary font-light">
              {termLabel}
            </Badge>
          )}
        </header>
        {/* Page content */}
        <main className="flex-1 bg-brand-canvas sm:p-6 p-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
