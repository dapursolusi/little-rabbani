'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { User } from '@/features/auth/types';
import {
  BookOpen01Icon,
  Calendar01Icon,
  ChevronRightIcon,
  ClipboardIcon,
  Clock01Icon,
  DashboardSquare01Icon,
  DatabaseSettingIcon,
  File01Icon,
  File02Icon,
  Folder01Icon,
  HierarchyCircle03Icon,
  NoteIcon,
  Settings01Icon,
  Settings04Icon,
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
  roles?: string[];
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
    roles?: string[];
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
    href: '/dashboard',
    icon: DashboardSquare01Icon,
  },
  {
    slug: 'master-data',
    title: 'Master Data',
    isActive: true,
    icon: DatabaseSettingIcon,
    roles: ['owner'],
    subItems: [
      {
        title: 'Wali Murid',
        href: '/dashboard/guardian',
        icon: UserGroup02Icon,
        roles: ['owner'],
      },
      {
        title: 'Murid',
        href: '/dashboard/kid',
        icon: UserMultipleIcon,
        roles: ['owner'],
      },
      {
        title: 'Term',
        href: '/dashboard/term',
        icon: Calendar01Icon,
        roles: ['owner'],
      },
      {
        title: 'Tipe Sesi',
        href: '/dashboard/session-type',
        icon: Calendar01Icon,
        roles: ['owner'],
      },
      {
        title: 'Aktivitas',
        href: '/dashboard/activity',
        icon: Folder01Icon,
        roles: ['owner'],
      },
      {
        title: 'Kurikulum',
        href: '/dashboard/curriculum',
        icon: BookOpen01Icon,
        roles: ['owner'],
      },
    ],
  },
  {
    slug: 'operational',
    title: 'Operasional',
    icon: WorkIcon,
    subItems: [
      {
        title: 'Jadwal',
        href: '/dashboard/calendar',
        icon: Clock01Icon,
        roles: ['owner', 'teacher'],
      },
      {
        title: 'DCR / Observasi Kelas',
        href: '/dashboard/daily',
        icon: ClipboardIcon,
        roles: ['owner', 'teacher'],
      },
    ],
  },
  {
    slug: 'reports',
    title: 'Laporan',
    icon: NoteIcon,
    roles: ['owner'],
    subItems: [
      {
        title: 'Laporan Wali Murid',
        href: '/dashboard/reports/daily',
        icon: File02Icon,
        roles: ['owner'],
      },
      {
        title: 'Laporan Bulanan',
        href: '/dashboard/reports/monthly',
        icon: File01Icon,
        roles: ['owner'],
      },
      {
        title: 'Laporan Triwulanan',
        href: '/dashboard/reports/quarterly',
        icon: File01Icon,
        roles: ['owner'],
      },
    ],
  },
  {
    slug: 'configuration',
    title: 'Konfigurasi',
    icon: Settings04Icon,
    roles: ['owner'],
    subItems: [
      {
        title: 'Tema & Subtema',
        href: '/dashboard/theme',
        icon: HierarchyCircle03Icon,
        roles: ['owner'],
      },
    ],
  },
  {
    slug: 'system',
    label: 'Sistem',
    title: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings01Icon,
    roles: ['owner'],
  },
];

export function AppSidebar({
  user,
}: {
  user: Pick<User, 'name' | 'email' | 'image' | 'role'> | undefined;
}) {
  const pathname = usePathname();

  if (!user) return null;

  const userRole = user.role;
  const isVisible = (roles?: string[]) =>
    !roles || (userRole !== undefined && roles.includes(userRole));

  const visibleGroups: SidebarNavItem[] = navGroups
    .filter((group) => {
      if (group.subItems) {
        return (
          group.roles === undefined ||
          (userRole !== undefined && group.roles.includes(userRole))
        );
      }
      return isVisible(group.roles);
    })
    .map((group) => {
      if (group.subItems) {
        return {
          ...group,
          subItems: group.subItems.filter((item) => isVisible(item.roles)),
        };
      }
      return group;
    })
    .filter((group) => !group.subItems || group.subItems.length > 0);

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent className="space-y-1 px-2">
        {visibleGroups.map((group) => (
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
