'use client';

import * as React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/** Maps known route paths to human-readable labels. */
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard/owner': 'Dashboard',
  '/dashboard/owner/kid': 'Anak',
  '/dashboard/owner/guardian': 'Wali',
  '/dashboard/owner/activity': 'Aktivitas',
  '/dashboard/owner/dcr': 'DCR',
  '/dashboard/owner/reports': 'Laporan',
  '/dashboard/owner/reports/daily': 'Laporan Harian',
  '/edit': 'Edit',
};

function buildSegments(pathname: string) {
  const segments: { label: string; href?: string }[] = [];
  const parts = pathname.split('/').filter(Boolean);

  // Always start with Home
  // segments.push({ label: 'Home', href: '/dashboard/Owner' });

  let accumulated = '';
  for (const part of parts) {
    accumulated += '/' + part;
    const label = ROUTE_LABELS[accumulated];
    if (label) {
      segments.push({ label, href: accumulated });
    }
  }

  return segments;
}

export function SidebarBreadcrumb() {
  const pathname = usePathname();
  const segments = buildSegments(pathname);

  if (segments.length === 1) {
    return null;
  }

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <React.Fragment key={segment.label + index}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !segment.href ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={segment.href}>{segment.label}</Link>}
                  />
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
