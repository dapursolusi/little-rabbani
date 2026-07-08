'use client';

import { useCallback } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Calendar01Icon, ClipboardIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { label: 'Jadwal', href: '/dashboard/teacher', icon: Calendar01Icon },
  {
    label: 'Observasi',
    href: '/dashboard/teacher/capture',
    icon: ClipboardIcon,
  },
];

export function TeacherTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab =
    tabs.find((t) => pathname.startsWith(t.href))?.href ?? tabs[0].href;

  const handleTabChange = useCallback(
    (value: string) => {
      router.push(value);
    },
    [router]
  );

  return (
    <>
      {/* Desktop: top tab bar using shadcn Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="hidden md:block border-b border-zinc-200 bg-white"
      >
        <div className="px-4">
          <TabsList variant="line" className="h-12 w-auto bg-transparent">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.href}
                value={tab.href}
                className="gap-2 px-4 data-active:border-b-2 data-active:border-primary rounded-none"
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  strokeWidth={2}
                  className="h-4 w-4"
                />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Mobile: bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white md:hidden">
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-zinc-500'
                }`}
              >
                <HugeiconsIcon
                  icon={tab.icon}
                  strokeWidth={2}
                  className="h-5 w-5"
                />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
