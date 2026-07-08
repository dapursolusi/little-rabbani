'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Calendar01Icon,
  CalendarCheckIcon,
  ClipboardIcon,
  Clock01Icon,
  DashboardSquare01Icon,
  File01Icon,
  File02Icon,
  Folder01Icon,
  Settings01Icon,
  UserGroup02Icon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { LogoutButtonClient } from '@/components/layout/logout-button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const navGroups = [
  {
    label: 'Ringkasan',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard/owner',
        icon: DashboardSquare01Icon,
      },
    ],
  },
  {
    label: 'Data Master',
    items: [
      { label: 'Murid', href: '/dashboard/owner/kid', icon: UserMultipleIcon },
      {
        label: 'Wali Murid',
        href: '/dashboard/owner/guardian',
        icon: UserGroup02Icon,
      },
      { label: 'Term', href: '/dashboard/owner/term', icon: Calendar01Icon },
      {
        label: 'Sesi',
        href: '/dashboard/owner/session',
        icon: CalendarCheckIcon,
      },
      {
        label: 'Aktivitas',
        href: '/dashboard/owner/activity',
        icon: Folder01Icon,
      },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { label: 'Jadwal', href: '/dashboard/owner/schedule', icon: Clock01Icon },
      {
        label: 'DCR / Observasi Kelas',
        href: '/dashboard/owner/dcr',
        icon: ClipboardIcon,
      },
    ],
  },
  {
    label: 'Laporan',
    items: [
      {
        label: 'Laporan Wali Murid',
        href: '/dashboard/owner/reports/daily',
        icon: File02Icon,
      },
      {
        label: 'Laporan Bulanan',
        href: '/dashboard/owner/reports/monthly',
        icon: File01Icon,
      },
      {
        label: 'Laporan Triwulanan',
        href: '/dashboard/owner/reports/quarterly',
        icon: File01Icon,
      },
    ],
  },
  {
    label: 'Sistem',
    items: [
      {
        label: 'Pengaturan',
        href: '/dashboard/owner/settings',
        icon: Settings01Icon,
      },
    ],
  },
];

export function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" side="left">
      <SidebarHeader className="px-4 py-3">
        <Link
          href="/dashboard/owner"
          className="text-lg font-semibold text-sidebar-foreground"
        >
          Little Rabbani
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            <SidebarSeparator />
          </SidebarGroup>
        ))}
      </SidebarContent>
      <div className="mt-auto border-t border-sidebar-border p-4">
        <LogoutButtonClient />
      </div>
    </Sidebar>
  );
}
