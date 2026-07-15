import { WhatsAppButton } from '@/components/layout/whatsapp-button';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Toaster />
      {children}
    </SidebarProvider>
  );
}
