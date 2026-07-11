import { LogoutButtonClient } from '@/components/layout/logout-button';
import { MobileNavSheet } from '@/components/layout/mobile-nav-sheet';
import { OwnerSidebar } from '@/components/layout/owner-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OwnerSidebar />
      <SidebarInset>
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border bg-card px-4 py-2">
          <SidebarTrigger className="hidden md:flex" />
          <MobileNavSheet />
          <div className="ml-auto flex items-center gap-2">
            <LogoutButtonClient />
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 bg-brand-canvas">{children}</main>
      </SidebarInset>
    </>
  );
}
