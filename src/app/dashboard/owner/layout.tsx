import { headers } from 'next/headers';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarBreadcrumb } from '@/components/layout/sidebar/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

import { auth } from '@/lib/auth';

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <>
      <AppSidebar user={session?.user} />
      <SidebarInset>
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border bg-card px-4 py-2">
          <div className="flex items-center gap-2 w-max">
            <SidebarTrigger />
            <Separator orientation="vertical" />
            <SidebarBreadcrumb />
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 bg-brand-canvas">{children}</main>
      </SidebarInset>
    </>
  );
}
