'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { School, SidebarNavItem } from '@/config/navigation';
import { User } from '@/features/auth/types';
import { ChevronRightIcon } from '@hugeicons/core-free-icons';
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

export function AppSidebar({
  user,
  schools,
  navGroups,
}: {
  user: Pick<User, 'name' | 'email' | 'image' | 'role'> | undefined;
  schools: School[];
  navGroups: SidebarNavItem[];
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
        <TeamSwitcher teams={schools} />
      </SidebarHeader>
      <SidebarContent className="space-y-1 px-2">
        {visibleGroups.map((group) => {
          const isParentActive =
            group.subItems?.some((item) => pathname === item.href) ?? false;
          return (
            <SidebarGroup key={group.slug} className="md:p-0">
              {group.label && (
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.subItems ? (
                    <Collapsible
                      key={pathname}
                      defaultOpen={isParentActive || group.isActive}
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
          );
        })}
      </SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
