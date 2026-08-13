import Link from 'next/link';

import {
  CalendarAdd01Icon,
  ClipboardIcon,
  File02Icon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';

const actions = [
  {
    label: 'Buat DCR',
    href: '/dashboard/dcr',
    icon: ClipboardIcon,
    variant: 'default' as const,
  },
  {
    label: 'Tambah Murid',
    href: '/dashboard/kid/create',
    icon: UserAdd01Icon,
    variant: 'outline' as const,
  },
  {
    label: 'Buat Sesi',
    href: '/dashboard/session',
    icon: CalendarAdd01Icon,
    variant: 'outline' as const,
  },
  {
    label: 'Laporan Wali Murid',
    href: '/dashboard/reports/daily',
    icon: File02Icon,
    variant: 'outline' as const,
  },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Button variant={action.variant} className="gap-2">
            <HugeiconsIcon
              icon={action.icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
