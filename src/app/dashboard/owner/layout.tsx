import Link from 'next/link';

import { LogoutButtonClient } from '@/components/layout/logout-button';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/dashboard/owner"
            className="text-lg font-semibold text-zinc-900"
          >
            Little Rabbani
          </Link>
          <LogoutButtonClient />
        </div>

        {/* Navigation */}
        <nav className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-4 pb-1 pt-2 text-sm">
          <NavLink href="/dashboard/owner">Dashboard</NavLink>
          <NavLink href="/dashboard/owner/kid">Murid</NavLink>
          <NavLink href="/dashboard/owner/guardian">Wali Murid</NavLink>
          <NavLink href="/dashboard/owner/term">Term</NavLink>
          <NavLink href="/dashboard/owner/session">Sesi</NavLink>
          <NavLink href="/dashboard/owner/activity">Aktivitas</NavLink>
          <NavLink href="/dashboard/owner/schedule">Jadwal</NavLink>
          <NavLink href="/dashboard/owner/dcr">Laporan Harian</NavLink>
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-md px-3 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
    >
      {children}
    </Link>
  );
}
