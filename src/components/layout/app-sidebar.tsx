'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { User } from '@/features/auth/types';
import {
  Calendar01Icon,
  CalendarCheckIcon,
  ChevronRightIcon,
  ClipboardIcon,
  Clock01Icon,
  DashboardSquare01Icon,
  DatabaseSettingIcon,
  File01Icon,
  File02Icon,
  Folder01Icon,
  NoteIcon,
  Settings01Icon,
  UserGroup02Icon,
  UserMultipleIcon,
  WorkIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

import { NavUser } from './sidebar/nav-user';
import { TeamSwitcher } from './sidebar/team-switcher';

type BaseNavItem = {
  slug: string;
  title: string;
  label?: string;
  icon?: React.ReactNode | IconSvgElement;
};

type LeafNavItem = BaseNavItem & {
  href: string;
  isActive?: never;
  subItems?: never; // Explicitly forbids subItems when href exists
};

type ParentNavItem = BaseNavItem & {
  href?: never; // Explicitly forbids href when subItems exist
  isActive?: boolean;
  subItems: {
    title: string;
    href: string;
    icon?: React.ReactNode | IconSvgElement;
  }[];
};

export type SidebarNavItem = LeafNavItem | ParentNavItem;

const teams = [
  {
    name: 'Little Rabbani',
    logo: DashboardSquare01Icon,
    plan: 'Owner',
  },
];
const navGroups: SidebarNavItem[] = [
  {
    slug: 'dashboard',
    label: '',
    title: 'Dashboard',
    href: '/dashboard/owner',
    icon: DashboardSquare01Icon,
  },
  {
    slug: 'master-data',
    title: 'Master Data',
    isActive: true,
    icon: DatabaseSettingIcon,
    subItems: [
      { title: 'Murid', href: '/dashboard/owner/kid', icon: UserMultipleIcon },
      {
        title: 'Wali Murid',
        href: '/dashboard/owner/guardian',
        icon: UserGroup02Icon,
      },
      { title: 'Term', href: '/dashboard/owner/term', icon: Calendar01Icon },
      {
        title: 'Sesi',
        href: '/dashboard/owner/session',
        icon: CalendarCheckIcon,
      },
      {
        title: 'Aktivitas',
        href: '/dashboard/owner/activity',
        icon: Folder01Icon,
      },
    ],
  },
  {
    slug: 'operational',
    title: 'Operasional',
    icon: WorkIcon,
    subItems: [
      { title: 'Jadwal', href: '/dashboard/owner/schedule', icon: Clock01Icon },
      {
        title: 'DCR / Observasi Kelas',
        href: '/dashboard/owner/dcr',
        icon: ClipboardIcon,
      },
    ],
  },
  {
    slug: 'reports',
    title: 'Laporan',
    icon: NoteIcon,
    subItems: [
      {
        title: 'Laporan Wali Murid',
        href: '/dashboard/owner/reports/daily',
        icon: File02Icon,
      },
      {
        title: 'Laporan Bulanan',
        href: '/dashboard/owner/reports/monthly',
        icon: File01Icon,
      },
      {
        title: 'Laporan Triwulanan',
        href: '/dashboard/owner/reports/quarterly',
        icon: File01Icon,
      },
    ],
  },
  {
    slug: 'system',
    label: 'Sistem',
    title: 'Pengaturan',
    href: '/dashboard/owner/settings',
    icon: Settings01Icon,
  },
];

export function AppSidebar({
  user,
}: {
  user: Pick<User, 'name' | 'email' | 'image'> | undefined;
}) {
  const pathname = usePathname();

  if (!user) return null;

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent className="space-y-1 px-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.slug} className="md:p-0">
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.subItems ? (
                  <Collapsible
                    defaultOpen={group.isActive}
                    className="group/collapsible"
                    render={<SidebarMenuItem />}
                  >
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuButton
                          tooltip={group.title}
                          className="max-md:h-12"
                        />
                      }
                    >
                      {group.icon && (
                        <HugeiconsIcon icon={group.icon as IconSvgElement} />
                      )}
                      <span>{group.title}</span>
                      <HugeiconsIcon
                        icon={ChevronRightIcon}
                        strokeWidth={2}
                        className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90"
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.subItems?.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton
                                render={<Link href={item.href} />}
                                isActive={isActive}
                                className="max-md:h-11"
                              >
                                <HugeiconsIcon
                                  icon={item.icon as IconSvgElement}
                                  strokeWidth={2}
                                />
                                <span>{item.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href={group.href} />}
                      tooltip={group.title}
                      className="max-md:h-11"
                    >
                      {group.icon && (
                        <HugeiconsIcon icon={group.icon as IconSvgElement} />
                      )}
                      <span>{group.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
