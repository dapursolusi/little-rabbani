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
  Menu01Icon,
  Settings01Icon,
  UserGroup02Icon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { LogoutButtonClient } from '@/components/layout/logout-button';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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

export function MobileNavSheet() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Buka menu navigasi"
          >
            <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
          </Button>
        }
      ></SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 py-3 border-b border-zinc-200">
          <SheetTitle className="text-left text-lg font-semibold">
            Little Rabbani
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <HugeiconsIcon
                          icon={item.icon}
                          strokeWidth={2}
                          className="h-5 w-5 shrink-0"
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-zinc-200 p-4">
          <LogoutButtonClient />
        </div>
      </SheetContent>
    </Sheet>
  );
}
